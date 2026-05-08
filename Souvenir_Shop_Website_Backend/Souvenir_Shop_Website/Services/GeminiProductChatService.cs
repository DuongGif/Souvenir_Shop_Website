using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.DTOs.Ai;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Services;

public class GeminiProductChatService
{
	private readonly HttpClient _httpClient;
	private readonly IConfiguration _configuration;
	private readonly SouvenirShopContext _db;

	private static DateTime _lastAiCall = DateTime.MinValue;

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
				Reply = "Bạn hãy nhập nhu cầu mua hàng để mình tư vấn nhé 🛍️",
				Products = new List<AiProductSuggestionDto>()
			};
		}

		var maxProducts = req.MaxProducts <= 0
			? 4
			: Math.Min(req.MaxProducts, 4);

		var products = await GetProductsAsync(cancellationToken);

		if (products.Count == 0)
		{
			return new AiChatRecommendResponse
			{
				Reply = "Hiện tại cửa hàng chưa có sản phẩm phù hợp 😢",
				Products = new List<AiProductSuggestionDto>()
			};
		}

		var candidates = FilterProducts(message, products)
			.Take(5)
			.ToList();

		var seconds = (DateTime.UtcNow - _lastAiCall).TotalSeconds;

		// cooldown chống spam free tier
		if (seconds < 15)
		{
			return CreateFallback(
				candidates,
				maxProducts,
				"cooldown"
			);
		}

		try
		{
			_lastAiCall = DateTime.UtcNow;

			var aiResult = await AskGeminiAsync(
				message,
				candidates,
				maxProducts,
				cancellationToken
			);

			if (aiResult == null || aiResult.Items.Count == 0)
			{
				return CreateFallback(
					candidates,
					maxProducts,
					"empty"
				);
			}

			var resultProducts = candidates
				.Where(p => aiResult.Items.Any(x => x.ProductId == p.Id))
				.Take(maxProducts)
				.Select(p =>
				{
					var aiItem = aiResult.Items
						.FirstOrDefault(x => x.ProductId == p.Id);

					return new AiProductSuggestionDto
					{
						Id = p.Id,
						Name = p.Name,
						Slug = p.Slug,
						Price = p.Price,
						ImageUrl = p.ImageUrl,
						CategoryName = p.CategoryName,
						Reason = aiItem?.Reason
							?? "Phù hợp với nhu cầu của bạn."
					};
				})
				.ToList();

			if (resultProducts.Count == 0)
			{
				return CreateFallback(
					candidates,
					maxProducts,
					"no_result"
				);
			}

			return new AiChatRecommendResponse
			{
				Reply = string.IsNullOrWhiteSpace(aiResult.Reply)
					? "Mình đã chọn giúp bạn vài sản phẩm phù hợp nè 🛍️"
					: aiResult.Reply,
				Products = resultProducts
			};
		}
		catch (Exception ex)
		{
			return CreateFallback(
				candidates,
				maxProducts,
				ex.Message
			);
		}
	}

	private AiChatRecommendResponse CreateFallback(
		List<ProductDto> products,
		int maxProducts,
		string message)
	{
		var lower = message.ToLowerInvariant();

		var reply =
			"Mình đã chọn nhanh một số sản phẩm phù hợp với nhu cầu của bạn nè 🛍️";

		if (lower.Contains("429") ||
			lower.Contains("quota") ||
			lower.Contains("too many requests"))
		{
			reply =
				"Hiện AI đang quá tải hoặc đã hết lượt miễn phí hôm nay 😢 "
				+ "Mình vẫn chọn giúp bạn vài sản phẩm phù hợp nhé.";
		}
		else if (lower.Contains("403"))
		{
			reply =
				"AI hiện chưa kết nối được 😢 "
				+ "Nhưng mình vẫn gợi ý nhanh cho bạn vài sản phẩm phù hợp nha.";
		}
		else if (lower.Contains("404"))
		{
			reply =
				"Model AI hiện chưa khả dụng 😢 "
				+ "Mình vẫn chọn giúp bạn vài sản phẩm phù hợp nhé.";
		}
		else if (lower.Contains("cooldown"))
		{
			reply =
				"Mình đang xử lý khá nhiều yêu cầu 😄 "
				+ "Đây là vài sản phẩm phù hợp dành cho bạn nhé.";
		}

		var resultProducts = products
			.Take(maxProducts)
			.Select((p, index) =>
			{
				var reason = "Phù hợp với nhu cầu của bạn.";

				if (index == 0)
				{
					reason =
						"Đây là sản phẩm nổi bật và rất phù hợp với nhu cầu bạn đang tìm.";
				}
				else if (p.Price < 100000)
				{
					reason =
						"Giá khá hợp lý, phù hợp để mua làm quà hoặc lưu niệm.";
				}
				else if (p.Price < 300000)
				{
					reason =
						"Mức giá tốt và được nhiều khách lựa chọn.";
				}
				else
				{
					reason =
						"Thiết kế đẹp và phù hợp để làm quà tặng.";
				}

				return new AiProductSuggestionDto
				{
					Id = p.Id,
					Name = p.Name,
					Slug = p.Slug,
					Price = p.Price,
					ImageUrl = p.ImageUrl,
					CategoryName = p.CategoryName,
					Reason = reason
				};
			})
			.ToList();

		return new AiChatRecommendResponse
		{
			Reply = reply,
			Products = resultProducts
		};
	}

	private async Task<List<ProductDto>> GetProductsAsync(
		CancellationToken cancellationToken)
	{
		var products = await _db.Products
			.AsNoTracking()
			.OrderByDescending(x => x.CreatedAt)
			.Take(20)
			.Select(x => new ProductDto
			{
				Id = x.Id,

				Name = _db.ProductTranslations
					.Where(t => t.ProductId == x.Id)
					.Select(t => t.Name)
					.FirstOrDefault() ?? $"Sản phẩm {x.Id}",

				Slug = x.Slug ?? "",

				Price = _db.ProductVariants
					.Where(v =>
						v.ProductId == x.Id &&
						v.IsActive == true)
					.Select(v => (decimal?)v.Price)
					.Min() ?? x.BasePrice ?? 0,

				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == x.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault() ?? "",

				CategoryName = _db.CategoryTranslations
					.Where(c => c.CategoryId == x.CategoryId)
					.Select(c => c.Name)
					.FirstOrDefault() ?? ""
			})
			.ToListAsync(cancellationToken);

		return products;
	}

	private List<ProductDto> FilterProducts(
		string message,
		List<ProductDto> products)
	{
		var text = message.ToLowerInvariant();

		return products
			.Select(p =>
			{
				var score = 0;

				var name = p.Name.ToLowerInvariant();
				var category = p.CategoryName.ToLowerInvariant();

				if (text.Contains("móc khóa") ||
					text.Contains("moc khoa"))
				{
					if (name.Contains("móc khóa") ||
						name.Contains("moc khoa") ||
						category.Contains("móc khóa"))
					{
						score += 100;
					}
				}

				if (text.Contains("ly") ||
					text.Contains("cốc"))
				{
					if (name.Contains("ly") ||
						name.Contains("cốc") ||
						category.Contains("ly"))
					{
						score += 100;
					}
				}

				if (text.Contains("áo"))
				{
					if (name.Contains("áo") ||
						category.Contains("áo"))
					{
						score += 100;
					}
				}

				if (text.Contains("quà") ||
					text.Contains("lưu niệm"))
				{
					score += 20;
				}

				return new
				{
					Product = p,
					Score = score
				};
			})
			.OrderByDescending(x => x.Score)
			.Select(x => x.Product)
			.ToList();
	}

	private async Task<GeminiResult?> AskGeminiAsync(
		string userMessage,
		List<ProductDto> products,
		int maxProducts,
		CancellationToken cancellationToken)
	{
		var apiKey = _configuration["Gemini:ApiKey"];
		var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash";

		var productText = string.Join(
			"\n",
			products.Select(p =>
				$"{p.Id} | {p.Name} | {p.Price}")
		);

		// KHÔNG dùng raw string nữa để tránh lỗi escape {}
		var prompt =
			"Khách cần: " + userMessage + "\n\n" +
			"Sản phẩm:\n" +
			productText + "\n\n" +
			$"Chọn tối đa {maxProducts} sản phẩm phù hợp.\n\n" +
			"Chỉ trả về JSON đúng format sau:\n\n" +
			"{\n" +
			"  \"reply\": \"Tin nhắn tư vấn ngắn gọn\",\n" +
			"  \"items\": [\n" +
			"    {\n" +
			"      \"productId\": 1,\n" +
			"      \"reason\": \"Lý do phù hợp\"\n" +
			"    }\n" +
			"  ]\n" +
			"}";

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
					new
					{
						text = prompt
					}
				}
			}
		},
			generationConfig = new
			{
				temperature = 0.2,
				maxOutputTokens = 180,
				responseMimeType = "application/json"
			}
		};

		var json = JsonSerializer.Serialize(body);

		using var content =
			new StringContent(json, Encoding.UTF8, "application/json");

		using var response =
			await _httpClient.PostAsync(url, content, cancellationToken);

		var responseText =
			await response.Content.ReadAsStringAsync(cancellationToken);

		if (!response.IsSuccessStatusCode)
		{
			throw new Exception(responseText);
		}

		using var doc = JsonDocument.Parse(responseText);

		var text =
			doc.RootElement
				.GetProperty("candidates")[0]
				.GetProperty("content")
				.GetProperty("parts")[0]
				.GetProperty("text")
				.GetString();

		if (string.IsNullOrWhiteSpace(text))
			return null;

		text = text
			.Replace("```json", "")
			.Replace("```", "")
			.Trim();

		return JsonSerializer.Deserialize<GeminiResult>(
			text,
			new JsonSerializerOptions
			{
				PropertyNameCaseInsensitive = true
			});
	}

	private class ProductDto
	{
		public long Id { get; set; }
		public string Name { get; set; } = "";
		public string Slug { get; set; } = "";
		public decimal Price { get; set; }
		public string ImageUrl { get; set; } = "";
		public string CategoryName { get; set; } = "";
	}

	private class GeminiResult
	{
		public string Reply { get; set; } = "";
		public List<GeminiItem> Items { get; set; } = new();
	}

	private class GeminiItem
	{
		public long ProductId { get; set; }
		public string Reason { get; set; } = "";
	}
}