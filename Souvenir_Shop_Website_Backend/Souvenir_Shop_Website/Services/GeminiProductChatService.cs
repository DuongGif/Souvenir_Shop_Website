using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.DTOs.Ai;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Services;

public class GeminiProductChatService
{
	private readonly HttpClient _httpClient;
	private readonly IConfiguration _configuration;
	private readonly SouvenirShopContext _db;

	public GeminiProductChatService(
		HttpClient httpClient,
		IConfiguration configuration,
		SouvenirShopContext db)
	{
		_httpClient = httpClient;
		_configuration = configuration;
		_db = db;
	}

	public async Task<AiChatRecommendResponse> RecommendAsync(
		AiChatRecommendRequest req,
		CancellationToken cancellationToken = default)
	{
		var message = req.Message?.Trim() ?? "";

		if (string.IsNullOrWhiteSpace(message))
		{
			return new AiChatRecommendResponse
			{
				Reply = "Bạn hãy nhập nhu cầu mua hàng để mình có thể tư vấn sản phẩm phù hợp nhé.",
				Products = new List<AiProductSuggestionDto>()
			};
		}

		var maxProducts = req.MaxProducts <= 0 ? 5 : Math.Min(req.MaxProducts, 8);

		var candidates = await GetProductCandidatesAsync(cancellationToken);

		if (candidates.Count == 0)
		{
			return new AiChatRecommendResponse
			{
				Reply = "Hiện tại cửa hàng chưa có sản phẩm phù hợp để gợi ý.",
				Products = new List<AiProductSuggestionDto>()
			};
		}

		// Lọc sản phẩm theo câu hỏi trước, rồi chỉ gửi tối đa 12 sản phẩm sang Gemini
		// để tránh prompt quá dài gây lỗi 429 Too Many Requests.
		candidates = FilterCandidatesByMessage(message, candidates)
			.Take(12)
			.ToList();

		if (candidates.Count == 0)
		{
			return new AiChatRecommendResponse
			{
				Reply = "Hiện tại cửa hàng chưa có sản phẩm phù hợp với nhu cầu bạn vừa nhập.",
				Products = new List<AiProductSuggestionDto>()
			};
		}

		var prompt = BuildPrompt(message, candidates, maxProducts);

		GeminiSuggestResult? aiResult = null;

		try
		{
			aiResult = await AskGeminiAsync(prompt, cancellationToken);
		}
		catch (Exception ex)
		{
			return CreateFallbackResponse(
				candidates,
				maxProducts,
				ex.Message
			);
		}

		if (aiResult == null || aiResult.Items == null || aiResult.Items.Count == 0)
		{
			return CreateFallbackResponse(
				candidates,
				maxProducts,
				"AI không trả về sản phẩm phù hợp."
			);
		}

		var reasonMap = aiResult.Items
			.Where(x => x.ProductId > 0)
			.GroupBy(x => x.ProductId)
			.ToDictionary(
				g => g.Key,
				g => string.IsNullOrWhiteSpace(g.First().Reason)
					? "Phù hợp với nhu cầu bạn vừa mô tả."
					: g.First().Reason
			);

		var selectedIds = aiResult.Items
			.Where(x => x.ProductId > 0)
			.Select(x => x.ProductId)
			.Distinct()
			.Take(maxProducts)
			.ToList();

		var selectedProducts = candidates
			.Where(p => selectedIds.Contains(p.Id))
			.OrderBy(p => selectedIds.IndexOf(p.Id))
			.Select(p => new AiProductSuggestionDto
			{
				Id = p.Id,
				Name = p.Name,
				Slug = p.Slug,
				Price = p.Price,
				ImageUrl = p.ImageUrl,
				CategoryName = p.CategoryName,
				Reason = reasonMap.TryGetValue(p.Id, out var reason)
					? reason
					: "Phù hợp với nhu cầu bạn vừa mô tả."
			})
			.ToList();

		if (selectedProducts.Count == 0)
		{
			return CreateFallbackResponse(
				candidates,
				maxProducts,
				"AI chọn sản phẩm không nằm trong danh sách của cửa hàng."
			);
		}

		return new AiChatRecommendResponse
		{
			Reply = string.IsNullOrWhiteSpace(aiResult.Reply)
				? "Mình gợi ý cho bạn một số sản phẩm phù hợp trong cửa hàng:"
				: aiResult.Reply,
			Products = selectedProducts
		};
	}

	private AiChatRecommendResponse CreateFallbackResponse(
		List<ProductCandidateDto> candidates,
		int maxProducts,
		string errorMessage)
	{
		var fallbackProducts = candidates
			.Take(maxProducts)
			.Select(p => new AiProductSuggestionDto
			{
				Id = p.Id,
				Name = p.Name,
				Slug = p.Slug,
				Price = p.Price,
				ImageUrl = p.ImageUrl,
				CategoryName = p.CategoryName,
				Reason = "Sản phẩm được gợi ý dựa trên nhu cầu bạn vừa nhập."
			})
			.ToList();

		var lowerError = errorMessage.ToLowerInvariant();

		var reply = "AI đang tạm thời không phản hồi. Mình vẫn gợi ý nhanh một số sản phẩm phù hợp trong cửa hàng:";

		if (lowerError.Contains("429") || lowerError.Contains("too many requests"))
		{
			reply = "AI đang quá tải hoặc đã hết lượt miễn phí. Mình vẫn gợi ý nhanh một số sản phẩm phù hợp trong cửa hàng:";
		}
		else if (lowerError.Contains("403") || lowerError.Contains("forbidden"))
		{
			reply = "API key AI hiện chưa có quyền truy cập. Mình vẫn gợi ý nhanh một số sản phẩm phù hợp trong cửa hàng:";
		}
		else if (lowerError.Contains("404") || lowerError.Contains("not found"))
		{
			reply = "Model AI hiện chưa đúng hoặc không khả dụng. Mình vẫn gợi ý nhanh một số sản phẩm phù hợp trong cửa hàng:";
		}

		return new AiChatRecommendResponse
		{
			Reply = reply,
			Products = fallbackProducts
		};
	}

	private async Task<List<ProductCandidateDto>> GetProductCandidatesAsync(
		CancellationToken cancellationToken)
	{
		var products = await _db.Products
			.AsNoTracking()
			.OrderByDescending(p => p.CreatedAt)
			.Take(80)
			.Select(p => new
			{
				p.Id,
				Slug = p.Slug ?? "",
				BasePrice = (decimal?)p.BasePrice,
				CategoryId = (long?)p.CategoryId,
				p.CreatedAt
			})
			.ToListAsync(cancellationToken);

		var productIds = products
			.Select(p => p.Id)
			.ToList();

		if (productIds.Count == 0)
			return new List<ProductCandidateDto>();

		var activeProductIds = await _db.ProductVariants
			.AsNoTracking()
			.Where(v => productIds.Contains(v.ProductId) && v.IsActive == true)
			.Select(v => v.ProductId)
			.Distinct()
			.ToListAsync(cancellationToken);

		var activeProductIdSet = activeProductIds.ToHashSet();

		if (activeProductIdSet.Count == 0)
			return new List<ProductCandidateDto>();

		var productNames = await _db.ProductTranslations
			.AsNoTracking()
			.Where(t => productIds.Contains(t.ProductId))
			.GroupBy(t => t.ProductId)
			.Select(g => new
			{
				ProductId = g.Key,
				Name = g.Select(x => x.Name).FirstOrDefault()
			})
			.ToDictionaryAsync(
				x => x.ProductId,
				x => x.Name ?? "",
				cancellationToken);

		var productImages = await _db.ProductImages
			.AsNoTracking()
			.Where(i => productIds.Contains(i.ProductId))
			.GroupBy(i => i.ProductId)
			.Select(g => new
			{
				ProductId = g.Key,
				ImageUrl = g.Select(x => x.ImageUrl).FirstOrDefault()
			})
			.ToDictionaryAsync(
				x => x.ProductId,
				x => x.ImageUrl ?? "",
				cancellationToken);

		var variantPrices = await _db.ProductVariants
			.AsNoTracking()
			.Where(v => productIds.Contains(v.ProductId) && v.IsActive == true)
			.GroupBy(v => v.ProductId)
			.Select(g => new
			{
				ProductId = g.Key,
				Price = g.Min(x => (decimal?)x.Price)
			})
			.ToDictionaryAsync(
				x => x.ProductId,
				x => x.Price,
				cancellationToken);

		var categoryIds = products
			.Where(p => p.CategoryId.HasValue)
			.Select(p => p.CategoryId!.Value)
			.Distinct()
			.ToList();

		var categoryNames = new Dictionary<long, string>();

		if (categoryIds.Count > 0)
		{
			categoryNames = await _db.CategoryTranslations
				.AsNoTracking()
				.Where(t => categoryIds.Contains(t.CategoryId))
				.GroupBy(t => t.CategoryId)
				.Select(g => new
				{
					CategoryId = g.Key,
					Name = g.Select(x => x.Name).FirstOrDefault()
				})
				.ToDictionaryAsync(
					x => x.CategoryId,
					x => x.Name ?? "",
					cancellationToken);
		}

		var result = products
			.Where(p => activeProductIdSet.Contains(p.Id))
			.Select(p =>
			{
				productNames.TryGetValue(p.Id, out var productName);
				productImages.TryGetValue(p.Id, out var imageUrl);
				var hasPrice = variantPrices.TryGetValue(p.Id, out var variantPrice);

				var categoryName = "";

				if (p.CategoryId.HasValue)
				{
					categoryNames.TryGetValue(p.CategoryId.Value, out categoryName);
				}

				return new ProductCandidateDto
				{
					Id = p.Id,
					Slug = p.Slug ?? "",
					Name = !string.IsNullOrWhiteSpace(productName)
						? productName
						: !string.IsNullOrWhiteSpace(p.Slug)
							? p.Slug
							: $"Sản phẩm #{p.Id}",
					CategoryName = categoryName ?? "",
					Price = hasPrice && variantPrice.HasValue
						? variantPrice.Value
						: p.BasePrice ?? 0,
					ImageUrl = imageUrl ?? ""
				};
			})
			.Where(p => !string.IsNullOrWhiteSpace(p.Name))
			.ToList();

		return result;
	}

	private List<ProductCandidateDto> FilterCandidatesByMessage(
		string message,
		List<ProductCandidateDto> products)
	{
		var text = RemoveVietnameseTone(message ?? "").ToLowerInvariant();
		var budget = ExtractBudget(text);

		var scoredProducts = products
			.Select(p =>
			{
				var score = 0;

				var name = RemoveVietnameseTone(p.Name ?? "").ToLowerInvariant();
				var category = RemoveVietnameseTone(p.CategoryName ?? "").ToLowerInvariant();
				var slug = RemoveVietnameseTone(p.Slug ?? "").ToLowerInvariant();

				var searchable = $"{name} {category} {slug}";

				if (budget.HasValue)
				{
					if (p.Price <= budget.Value)
						score += 70;
					else
						score -= 120;
				}

				if (text.Contains("re") || text.Contains("gia re") || text.Contains("binh dan"))
				{
					if (p.Price <= 100000) score += 45;
					else if (p.Price <= 200000) score += 25;
				}

				if (text.Contains("cao cap") || text.Contains("sang") || text.Contains("dep"))
				{
					if (p.Price >= 300000) score += 35;
				}

				if (text.Contains("me") || text.Contains("bo") || text.Contains("ba") || text.Contains("phu huynh"))
				{
					if (searchable.Contains("gom") ||
						searchable.Contains("tranh") ||
						searchable.Contains("ly") ||
						searchable.Contains("coc") ||
						searchable.Contains("tui") ||
						searchable.Contains("thu cong") ||
						searchable.Contains("qua"))
					{
						score += 40;
					}
				}

				if (text.Contains("ban gai") || text.Contains("nguoi yeu") || text.Contains("nu"))
				{
					if (searchable.Contains("hoa") ||
						searchable.Contains("gau") ||
						searchable.Contains("vong") ||
						searchable.Contains("tui") ||
						searchable.Contains("moc khoa") ||
						searchable.Contains("trang suc"))
					{
						score += 40;
					}
				}

				if (text.Contains("ban trai") || text.Contains("nam"))
				{
					if (searchable.Contains("moc khoa") ||
						searchable.Contains("vi") ||
						searchable.Contains("ly") ||
						searchable.Contains("coc") ||
						searchable.Contains("mo hinh") ||
						searchable.Contains("but"))
					{
						score += 40;
					}
				}

				if (text.Contains("tre em") || text.Contains("be") || text.Contains("con nit"))
				{
					if (searchable.Contains("gau") ||
						searchable.Contains("do choi") ||
						searchable.Contains("mo hinh") ||
						searchable.Contains("moc khoa"))
					{
						score += 40;
					}
				}

				if (text.Contains("moc khoa") && searchable.Contains("moc khoa"))
					score += 80;

				if (text.Contains("nam cham") && searchable.Contains("nam cham"))
					score += 80;

				if ((text.Contains("ly") || text.Contains("coc")) &&
					(searchable.Contains("ly") || searchable.Contains("coc")))
					score += 80;

				if (text.Contains("ao") && searchable.Contains("ao"))
					score += 80;

				if (text.Contains("tui") && searchable.Contains("tui"))
					score += 80;

				if (text.Contains("non") && searchable.Contains("non"))
					score += 80;

				if (text.Contains("tranh") && searchable.Contains("tranh"))
					score += 80;

				if (text.Contains("gom") && searchable.Contains("gom"))
					score += 80;

				if (text.Contains("nho gon") || text.Contains("de mang") || text.Contains("du lich"))
				{
					if (searchable.Contains("moc khoa") ||
						searchable.Contains("nam cham") ||
						searchable.Contains("but") ||
						searchable.Contains("vong") ||
						searchable.Contains("vi"))
					{
						score += 40;
					}
				}

				if (text.Contains("hai phong") && searchable.Contains("hai phong"))
					score += 60;

				if (text.Contains("luu niem") &&
					(searchable.Contains("luu niem") || searchable.Contains("qua")))
				{
					score += 35;
				}

				return new
				{
					Product = p,
					Score = score
				};
			})
			.OrderByDescending(x => x.Score)
			.ThenBy(x => x.Product.Price)
			.Select(x => x.Product)
			.ToList();

		return scoredProducts.Count > 0 ? scoredProducts : products;
	}

	private decimal? ExtractBudget(string text)
	{
		if (string.IsNullOrWhiteSpace(text))
			return null;

		var matches = Regex.Matches(text, @"\d+");

		if (matches.Count == 0)
			return null;

		var numbers = matches
			.Select(m => decimal.TryParse(m.Value, out var value) ? value : 0)
			.Where(value => value > 0)
			.ToList();

		if (numbers.Count == 0)
			return null;

		var max = numbers.Max();

		if (text.Contains("k") || text.Contains("nghin") || text.Contains("ngan"))
			return max * 1000;

		if (max < 1000)
			return max * 1000;

		return max;
	}

	private string BuildPrompt(
		string userMessage,
		List<ProductCandidateDto> products,
		int maxProducts)
	{
		var sb = new StringBuilder();

		sb.AppendLine("Bạn là trợ lý AI tư vấn mua hàng cho website bán đồ lưu niệm SouVN.");
		sb.AppendLine("Nhiệm vụ: dựa vào nhu cầu của khách và danh sách sản phẩm thật bên dưới, hãy gợi ý sản phẩm phù hợp.");
		sb.AppendLine("Quy tắc bắt buộc:");
		sb.AppendLine("- Chỉ được chọn sản phẩm có trong danh sách.");
		sb.AppendLine("- Không được tự bịa sản phẩm.");
		sb.AppendLine("- Nếu khách nói ngân sách, chỉ ưu tiên sản phẩm có giá bằng hoặc thấp hơn ngân sách.");
		sb.AppendLine("- Nếu khách nói mua cho mẹ, bố, bạn gái, bạn trai, trẻ em, hãy chọn sản phẩm phù hợp với đối tượng đó.");
		sb.AppendLine("- Không chọn lặp lại một kiểu sản phẩm nếu còn sản phẩm khác phù hợp.");
		sb.AppendLine("- Trả lời bằng tiếng Việt.");
		sb.AppendLine("- Tư vấn tự nhiên, thân thiện, giống nhân viên cửa hàng.");
		sb.AppendLine("- Chỉ trả về JSON hợp lệ, không thêm markdown.");
		sb.AppendLine();
		sb.AppendLine($"Nhu cầu khách hàng: {userMessage}");
		sb.AppendLine();
		sb.AppendLine("Danh sách sản phẩm:");

		foreach (var p in products)
		{
			sb.AppendLine($"ID: {p.Id}");
			sb.AppendLine($"Tên: {p.Name}");
			sb.AppendLine($"Danh mục: {p.CategoryName}");
			sb.AppendLine($"Giá: {p.Price:0} VND");
			sb.AppendLine("---");
		}

		sb.AppendLine();
		sb.AppendLine("Định dạng JSON bắt buộc:");
		sb.AppendLine("{");
		sb.AppendLine("  \"reply\": \"Câu trả lời tư vấn ngắn gọn\",");
		sb.AppendLine("  \"items\": [");
		sb.AppendLine("    {");
		sb.AppendLine("      \"productId\": 1,");
		sb.AppendLine("      \"reason\": \"Lý do nên mua sản phẩm này\"");
		sb.AppendLine("    }");
		sb.AppendLine("  ]");
		sb.AppendLine("}");
		sb.AppendLine();
		sb.AppendLine($"Chỉ chọn tối đa {maxProducts} sản phẩm.");

		return sb.ToString();
	}

	private async Task<GeminiSuggestResult?> AskGeminiAsync(
		string prompt,
		CancellationToken cancellationToken)
	{
		var apiKey = _configuration["Gemini:ApiKey"];
		var model = _configuration["Gemini:Model"] ?? "gemini-2.5-flash";

		if (string.IsNullOrWhiteSpace(apiKey))
			throw new InvalidOperationException("Missing Gemini API key.");

		if (model.StartsWith("models/"))
		{
			model = model.Replace("models/", "");
		}

		var url =
			$"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

		var body = new
		{
			contents = new[]
			{
				new
				{
					parts = new[]
					{
						new { text = prompt }
					}
				}
			},
			generationConfig = new
			{
				temperature = 0.3,
				maxOutputTokens = 700,
				responseMimeType = "application/json"
			}
		};

		var json = JsonSerializer.Serialize(body);

		using var content = new StringContent(json, Encoding.UTF8, "application/json");

		using var response = await _httpClient.PostAsync(url, content, cancellationToken);

		var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

		if (!response.IsSuccessStatusCode)
		{
			throw new Exception(
				$"Gemini API lỗi {(int)response.StatusCode} - {response.StatusCode}: {responseText}"
			);
		}

		using var doc = JsonDocument.Parse(responseText);

		if (!doc.RootElement.TryGetProperty("candidates", out var candidates))
			return null;

		if (candidates.GetArrayLength() == 0)
			return null;

		var text = candidates[0]
			.GetProperty("content")
			.GetProperty("parts")[0]
			.GetProperty("text")
			.GetString();

		if (string.IsNullOrWhiteSpace(text))
			return null;

		var cleanJson = CleanGeminiJson(text);

		return JsonSerializer.Deserialize<GeminiSuggestResult>(
			cleanJson,
			new JsonSerializerOptions
			{
				PropertyNameCaseInsensitive = true
			});
	}

	private static string CleanGeminiJson(string raw)
	{
		var text = raw.Trim();

		text = Regex.Replace(text, "^```json", "", RegexOptions.IgnoreCase).Trim();
		text = Regex.Replace(text, "^```", "", RegexOptions.IgnoreCase).Trim();
		text = Regex.Replace(text, "```$", "", RegexOptions.IgnoreCase).Trim();

		var start = text.IndexOf('{');
		var end = text.LastIndexOf('}');

		if (start >= 0 && end > start)
		{
			text = text.Substring(start, end - start + 1);
		}

		return text;
	}

	private static string RemoveVietnameseTone(string text)
	{
		if (string.IsNullOrWhiteSpace(text))
			return "";

		var result = text.ToLowerInvariant();

		result = Regex.Replace(result, "[àáạảãâầấậẩẫăằắặẳẵ]", "a");
		result = Regex.Replace(result, "[èéẹẻẽêềếệểễ]", "e");
		result = Regex.Replace(result, "[ìíịỉĩ]", "i");
		result = Regex.Replace(result, "[òóọỏõôồốộổỗơờớợởỡ]", "o");
		result = Regex.Replace(result, "[ùúụủũưừứựửữ]", "u");
		result = Regex.Replace(result, "[ỳýỵỷỹ]", "y");
		result = Regex.Replace(result, "[đ]", "d");

		return result;
	}

	private class ProductCandidateDto
	{
		public long Id { get; set; }
		public string Name { get; set; } = "";
		public string Slug { get; set; } = "";
		public string CategoryName { get; set; } = "";
		public decimal Price { get; set; }
		public string ImageUrl { get; set; } = "";
	}

	private class GeminiSuggestResult
	{
		public string Reply { get; set; } = "";
		public List<GeminiSuggestItem> Items { get; set; } = new();
	}

	private class GeminiSuggestItem
	{
		public long ProductId { get; set; }
		public string Reason { get; set; } = "";
	}
}