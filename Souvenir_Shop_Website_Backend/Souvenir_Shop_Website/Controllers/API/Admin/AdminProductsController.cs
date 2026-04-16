using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Product;
using Souvenir_Shop_Website.Models;
using System.Text;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/products")]
public class AdminProductsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly IWebHostEnvironment _env;

	private const decimal MAX_PRICE = 9999999999.9999m;

	public AdminProductsController(SouvenirShopContext db, IWebHostEnvironment env)
	{
		_db = db;
		_env = env;
	}

	private List<string> NormalizeImageUrls(IEnumerable<string>? imageUrls)
	{
		if (imageUrls == null) return new List<string>();

		return imageUrls
			.Where(x => !string.IsNullOrWhiteSpace(x))
			.Select(x => x.Trim())
			.Distinct(StringComparer.OrdinalIgnoreCase)
			.ToList();
	}

	private IActionResult? ValidateProductDto(ProductCreateUpdateDto dto)
	{
		if (dto == null)
			return BadRequest("Dữ liệu sản phẩm không hợp lệ.");

		if (string.IsNullOrWhiteSpace(dto.Slug))
			return BadRequest("Slug không được để trống.");

		if (dto.CategoryId <= 0)
			return BadRequest("CategoryId không hợp lệ.");

		if (dto.BasePrice == null)
			return BadRequest("Giá sản phẩm không được để trống.");

		if (dto.BasePrice < 0)
			return BadRequest("Giá sản phẩm không được âm.");

		if (dto.BasePrice > MAX_PRICE)
			return BadRequest($"Giá sản phẩm không được vượt quá {MAX_PRICE:N2}.");

		if (dto.Variants == null || dto.Variants.Count == 0)
			return BadRequest("Sản phẩm phải có ít nhất 1 biến thể.");

		for (int i = 0; i < dto.Variants.Count; i++)
		{
			var v = dto.Variants[i];

			if (string.IsNullOrWhiteSpace(v.Sku))
				return BadRequest($"SKU của biến thể thứ {i + 1} không được để trống.");

			if (string.IsNullOrWhiteSpace(v.VariantName))
				return BadRequest($"Tên biến thể thứ {i + 1} không được để trống.");

			if (v.Price.HasValue && v.Price.Value < 0)
				return BadRequest($"Giá của biến thể thứ {i + 1} không được âm.");

			if (v.InitialStock < 0)
				return BadRequest($"Tồn kho ban đầu của biến thể thứ {i + 1} không được âm.");
		}

		var duplicatedSku = dto.Variants
			.GroupBy(x => x.Sku.Trim(), StringComparer.OrdinalIgnoreCase)
			.FirstOrDefault(g => g.Count() > 1);

		if (duplicatedSku != null)
			return BadRequest($"SKU bị trùng trong danh sách biến thể: {duplicatedSku.Key}");

		return null;
	}

	private async Task<int> GetVariantStockAsync(long variantId)
	{
		return await _db.InventoryTransactions
			.Where(x => x.VariantId == variantId)
			.SumAsync(x => (int?)x.Quantity) ?? 0;
	}

	private static string NormalizeVietnameseText(string value)
	{
		return (value ?? string.Empty).Trim().Normalize(NormalizationForm.FormC);
	}

	private static string GetUniqueDisplayName(HashSet<string> usedNames, string baseName)
	{
		var cleanBase = NormalizeVietnameseText(baseName);
		var candidate = cleanBase;
		var index = 2;

		while (usedNames.Contains(candidate))
		{
			candidate = $"{cleanBase} {index}";
			index++;
		}

		usedNames.Add(candidate);
		return candidate;
	}

	private static string GetUniqueSku(HashSet<string> usedSkus, string baseSku)
	{
		var cleanBase = baseSku.Trim().ToUpperInvariant();
		var candidate = cleanBase;
		var index = 2;

		while (usedSkus.Contains(candidate))
		{
			candidate = $"{cleanBase}-{index}";
			index++;
		}

		usedSkus.Add(candidate);
		return candidate;
	}

	private static decimal GetSeedBasePrice(int groupIndex, Random rnd)
	{
		return groupIndex switch
		{
			0 => rnd.Next(49000, 199001),   // quà lưu niệm
			1 => rnd.Next(89000, 399001),   // đồ thủ công
			2 => rnd.Next(19000, 99001),    // móc khóa
			3 => rnd.Next(99000, 499001),   // áo du lịch
			4 => rnd.Next(49000, 299001),   // phụ kiện
			5 => rnd.Next(39000, 249001),   // đặc sản/quà set
			_ => rnd.Next(69000, 599001)    // khác
		};
	}

	private static readonly string[][] CategoryProductNameGroups =
	{
		new[]
		{
			"Cờ Việt Nam Mini Để Bàn",
			"Huy Hiệu Cờ Đỏ Sao Vàng",
			"Huy Hiệu Bản Đồ Việt Nam",
			"Nam Châm Tủ Lạnh Hà Nội",
			"Nam Châm Tủ Lạnh Đà Nẵng",
			"Nam Châm Tủ Lạnh Hải Phòng",
			"Bưu Thiếp Danh Lam Việt Nam",
			"Bộ Postcard Hà Nội Xưa",
			"Khung Ảnh Gỗ Việt Nam",
			"Lịch Để Bàn Phong Cảnh Việt Nam",
			"Bộ Sưu Tập Postcard Việt Nam",
			"Mô Hình Tháp Rùa Mini",
			"Mô Hình Nhà Hát Lớn Mini",
			"Mô Hình Cầu Rồng Mini",
			"Mô Hình Cột Cờ Hà Nội Mini"
		},
		new[]
		{
			"Tượng Gỗ Cô Gái Áo Dài",
			"Tượng Gỗ Chùa Một Cột",
			"Tượng Gỗ Trống Đồng Mini",
			"Quạt Tay Họa Tiết Dân Gian",
			"Quạt Giấy In Phong Cảnh Huế",
			"Ví Thổ Cẩm Mini",
			"Túi Thổ Cẩm Handmade",
			"Đĩa Gốm Trang Trí Bát Tràng",
			"Chén Sứ Hoa Sen",
			"Bộ Đũa Gỗ Khắc Tên Thành Phố",
			"Khay Gỗ Trang Trí Du Lịch",
			"Hộp Bút Tre Khắc Chữ Việt Nam",
			"Bookmark Tre Khắc Bản Đồ Việt Nam",
			"Bookmark Gỗ Hoa Sen",
			"Khăn Tay Thêu Hoa Sen"
		},
		new[]
		{
			"Móc Khóa Hình Chùa Một Cột",
			"Móc Khóa Hình Nón Lá",
			"Móc Khóa Hình Trống Đồng",
			"Móc Khóa Da Khắc Tên Thành Phố",
			"Mô Hình Xe Xích Lô Lưu Niệm",
			"Mô Hình Nón Lá Mini",
			"Mô Hình Trống Đồng Mini",
			"Móc Khóa Cờ Việt Nam",
			"Móc Khóa Phố Cổ Hà Nội",
			"Móc Khóa Cầu Rồng Đà Nẵng",
			"Móc Khóa Chợ Bến Thành",
			"Móc Khóa Bản Đồ Việt Nam",
			"Móc Khóa Áo Dài Mini",
			"Móc Khóa Gỗ Khắc Tên",
			"Móc Khóa Du Lịch SouVN"
		},
		new[]
		{
			"Áo Thun Du Lịch Hà Nội",
			"Áo Thun Du Lịch Hải Phòng",
			"Áo Hoodie Du Lịch Việt Nam",
			"Áo Polo SouVN",
			"Áo Sơ Mi Du Lịch",
			"Mũ Lưỡi Trai Việt Nam",
			"Mũ Bucket Du Lịch",
			"Khăn Choàng Du Lịch",
			"Áo Trẻ Em In Cờ Việt Nam",
			"Mũ Trẻ Em Du Lịch",
			"Túi Canvas Du Lịch Sài Gòn",
			"Túi Vải In Bản Đồ Việt Nam",
			"Balo Mini Du Lịch",
			"Túi Đeo Chéo Canvas",
			"Dép Đi Biển Du Lịch"
		},
		new[]
		{
			"Ly Giữ Nhiệt SouVN",
			"Bình Nước In Họa Tiết Việt",
			"Khăn Lụa In Họa Tiết Sen",
			"Khăn Lụa Phố Cổ",
			"Dây Đeo Thẻ Du Lịch",
			"Ốp Điện Thoại Họa Tiết Việt Nam",
			"Vòng Tay Thổ Cẩm",
			"Vòng Tay Hạt Gỗ Lưu Niệm",
			"Dây Chuyền Mặt Trống Đồng",
			"Bông Tai Gỗ Họa Tiết Dân Tộc",
			"Khóa Sổ Da Du Lịch",
			"Túi Đựng Hộ Chiếu Việt Nam",
			"Ví Passport Du Lịch",
			"Ví Zip Họa Tiết Việt",
			"Thẻ Hành Lý Du Lịch"
		},
		new[]
		{
			"Set Quà Cà Phê Việt Nam",
			"Set Quà Trà Sen",
			"Set Đặc Sản Miền Bắc",
			"Set Đặc Sản Miền Trung",
			"Set Đặc Sản Miền Nam",
			"Hộp Quà Lưu Niệm Việt Nam",
			"Bộ Quà Tặng Du Lịch Cao Cấp",
			"Hộp Trà Gỗ Khắc Hoa Sen",
			"Khay Trà Gỗ Việt Nam",
			"Set 4 Lót Ly Việt Nam",
			"Lót Ly Gỗ Khắc Bản Đồ",
			"Hộp Nhạc Phong Cảnh Việt Nam",
			"Chuông Gió Tre Lưu Niệm",
			"Set Quà Doanh Nghiệp SouVN",
			"Set Quà Hội Nghị Du Lịch"
		},
		new[]
		{
			"Sticker Du Lịch Việt Nam",
			"Set Sticker Thành Phố Nổi Tiếng",
			"Tranh Canvas Ruộng Bậc Thang",
			"Tranh Canvas Vịnh Hạ Long",
			"Tranh Canvas Hồ Gươm",
			"Tranh Gỗ Khắc Phố Cổ",
			"Đèn Ngủ Gỗ Khắc Hình Việt Nam",
			"Ống Đựng Bút Tre",
			"Bút Tre Khắc Tên",
			"Bút Kim Loại SouVN",
			"Chuỗi Hạt Trang Trí",
			"Gấu Bông Mặc Áo Dài",
			"Gấu Bông Đội Nón Lá",
			"Đèn Lồng Hội An Mini",
			"Lịch Gỗ Handmade"
		}
	};

	private static readonly string[] VariantSeeds =
	{
		"Mặc định",
		"Bản tiêu chuẩn",
		"Bản cao cấp",
		"Màu đỏ",
		"Màu xanh",
		"Màu vàng",
		"Cỡ S",
		"Cỡ M",
		"Cỡ L"
	};

	[HttpPut("{id:long}/images")]
	public async Task<IActionResult> ReplaceImages(long id, [FromBody] List<string> imageUrls)
	{
		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		var urls = NormalizeImageUrls(imageUrls);

		var oldImages = await _db.ProductImages
			.Where(x => x.ProductId == id)
			.ToListAsync();

		if (oldImages.Count > 0)
		{
			_db.ProductImages.RemoveRange(oldImages);
		}

		foreach (var url in urls)
		{
			_db.ProductImages.Add(new ProductImage
			{
				ProductId = id,
				ImageUrl = url
			});
		}

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Images replaced",
			productId = id,
			imageCount = urls.Count
		});
	}

	[HttpPost("upload-image")]
	public async Task<IActionResult> UploadImage(IFormFile file)
	{
		if (file == null || file.Length == 0)
			return BadRequest("File is required.");

		var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
		var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

		if (!allowedExtensions.Contains(ext))
			return BadRequest("Only .jpg, .jpeg, .png, .webp files are allowed.");

		var folderPath = Path.Combine(_env.WebRootPath, "images", "products");
		if (!Directory.Exists(folderPath))
			Directory.CreateDirectory(folderPath);

		var fileName = $"{Guid.NewGuid():N}{ext}";
		var filePath = Path.Combine(folderPath, fileName);

		using (var stream = new FileStream(filePath, FileMode.Create))
		{
			await file.CopyToAsync(stream);
		}

		var imageUrl = $"/images/products/{fileName}";
		return Ok(new { imageUrl });
	}

	[HttpGet("{id:long}/images")]
	public async Task<IActionResult> GetImages(long id)
	{
		var productExists = await _db.Products.AnyAsync(x => x.Id == id);
		if (!productExists) return NotFound("Không tìm thấy sản phẩm.");

		var images = await _db.ProductImages
			.Where(x => x.ProductId == id)
			.OrderBy(x => x.Id)
			.Select(x => x.ImageUrl)
			.ToListAsync();

		return Ok(images);
	}

	[HttpPost("{id:long}/images")]
	public async Task<IActionResult> AddImages(long id, [FromBody] List<string> imageUrls)
	{
		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		var urls = NormalizeImageUrls(imageUrls);
		if (urls.Count == 0)
			return BadRequest("Danh sách ảnh không hợp lệ.");

		foreach (var url in urls)
		{
			_db.ProductImages.Add(new ProductImage
			{
				ProductId = id,
				ImageUrl = url
			});
		}

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Images added",
			productId = id,
			imageCount = urls.Count
		});
	}

	[HttpPost("seed-realistic")]
	public async Task<IActionResult> SeedRealisticProducts([FromQuery] int count = 100)
	{
		if (count <= 0 || count > 500)
			return BadRequest("Số lượng sản phẩm phải trong khoảng từ 1 đến 500.");

		var categoryIds = await _db.Categories
			.AsNoTracking()
			.OrderBy(x => x.Id)
			.Select(x => x.Id)
			.ToListAsync();

		if (categoryIds.Count == 0)
			return BadRequest("Chưa có danh mục nào. Hãy tạo danh mục trước.");

		var existingNames = await _db.Products
			.AsNoTracking()
			.Where(x => !string.IsNullOrWhiteSpace(x.Slug))
			.Select(x => x.Slug)
			.ToListAsync();

		var existingSkus = await _db.ProductVariants
			.AsNoTracking()
			.Where(x => !string.IsNullOrWhiteSpace(x.Sku))
			.Select(x => x.Sku)
			.ToListAsync();

		var usedNames = new HashSet<string>(
			existingNames.Select(NormalizeVietnameseText),
			StringComparer.OrdinalIgnoreCase
		);

		var usedSkus = new HashSet<string>(existingSkus, StringComparer.OrdinalIgnoreCase);

		var rnd = new Random();
		var now = DateTime.Now;
		var createdIds = new List<long>();

		using var tx = await _db.Database.BeginTransactionAsync();

		try
		{
			for (int i = 0; i < count; i++)
			{
				var categoryIndex = i % categoryIds.Count;
				var categoryId = categoryIds[categoryIndex];

				var group = CategoryProductNameGroups[categoryIndex % CategoryProductNameGroups.Length];
				var roundIndex = i / categoryIds.Count;
				var rawName = group[roundIndex % group.Length];

				var displayName = GetUniqueDisplayName(usedNames, rawName);
				var basePrice = GetSeedBasePrice(categoryIndex % CategoryProductNameGroups.Length, rnd);
				var isFeatured = i < 16;

				var product = new Product
				{
					CategoryId = categoryId,
					Slug = NormalizeVietnameseText(displayName),
					BasePrice = basePrice,
					Status = "active",
					IsFeatured = isFeatured,
					CreatedAt = now,
					UpdatedAt = now
				};

				_db.Products.Add(product);
				await _db.SaveChangesAsync();
				createdIds.Add(product.Id);

				_db.ProductImages.Add(new ProductImage
				{
					ProductId = product.Id,
					ImageUrl = $"https://placehold.co/600x600/png?text={Uri.EscapeDataString(displayName)}"
				});

				_db.ProductImages.Add(new ProductImage
				{
					ProductId = product.Id,
					ImageUrl = $"https://placehold.co/600x600/png?text={Uri.EscapeDataString(displayName + " - SouVN")}"
				});

				var variantCount = rnd.Next(1, 4);
				for (int v = 0; v < variantCount; v++)
				{
					var variantName = VariantSeeds[(i + v) % VariantSeeds.Length];
					var sku = GetUniqueSku(usedSkus, $"SP{now:yyMMdd}{product.Id:D4}V{v + 1}");
					var variantPrice = basePrice + rnd.Next(0, 150000);

					var variant = new ProductVariant
					{
						ProductId = product.Id,
						Sku = sku,
						VariantName = NormalizeVietnameseText(variantName),
						Price = variantPrice,
						WeightGrams = rnd.Next(100, 1501),
						IsActive = true,
						CreatedAt = now
					};

					_db.ProductVariants.Add(variant);
					await _db.SaveChangesAsync();

					_db.InventoryTransactions.Add(new InventoryTransaction
					{
						VariantId = variant.Id,
						Type = "in",
						Quantity = rnd.Next(10, 101),
						ReferenceType = "seed_realistic",
						ReferenceId = product.Id,
						Note = "Nhập kho ban đầu khi tạo sản phẩm mẫu thực tế có dấu",
						CreatedAt = now
					});
				}

				await _db.SaveChangesAsync();
			}

			await tx.CommitAsync();

			return Ok(new
			{
				message = $"Đã tạo thành công {count} sản phẩm mẫu có dấu, chia đều cho tất cả danh mục.",
				createdCount = count,
				productIds = createdIds
			});
		}
		catch
		{
			await tx.RollbackAsync();
			throw;
		}
	}

	[HttpDelete("seed-realistic")]
	public async Task<IActionResult> DeleteSeedRealisticProducts([FromQuery] int take = 100)
	{
		if (take <= 0 || take > 500)
			return BadRequest("Số lượng xóa phải trong khoảng từ 1 đến 500.");

		var targetProductIds = await (
			from p in _db.Products.AsNoTracking()
			join v in _db.ProductVariants.AsNoTracking() on p.Id equals v.ProductId
			join it in _db.InventoryTransactions.AsNoTracking() on v.Id equals it.VariantId
			where it.ReferenceType == "seed_realistic"
			group p by new { p.Id, p.CreatedAt } into g
			orderby g.Key.CreatedAt descending
			select g.Key.Id
		)
		.Take(take)
		.ToListAsync();

		if (targetProductIds.Count == 0)
		{
			return Ok(new
			{
				message = "Không có sản phẩm có dấu nào do seed-realistic tạo ra để xóa.",
				deletedCount = 0
			});
		}

		var products = await _db.Products
			.Where(p => targetProductIds.Contains(p.Id))
			.ToListAsync();

		var variants = await _db.ProductVariants
			.Where(v => targetProductIds.Contains(v.ProductId))
			.ToListAsync();

		var variantIds = variants.Select(v => v.Id).ToList();

		var inventoryTransactions = await _db.InventoryTransactions
			.Where(x => variantIds.Contains(x.VariantId))
			.ToListAsync();

		var images = await _db.ProductImages
			.Where(x => targetProductIds.Contains(x.ProductId))
			.ToListAsync();

		using var tx = await _db.Database.BeginTransactionAsync();

		try
		{
			if (inventoryTransactions.Count > 0)
				_db.InventoryTransactions.RemoveRange(inventoryTransactions);

			if (images.Count > 0)
				_db.ProductImages.RemoveRange(images);

			if (variants.Count > 0)
				_db.ProductVariants.RemoveRange(variants);

			if (products.Count > 0)
				_db.Products.RemoveRange(products);

			await _db.SaveChangesAsync();
			await tx.CommitAsync();

			return Ok(new
			{
				message = $"Đã xóa thành công {products.Count} sản phẩm có dấu do seed-realistic tạo ra.",
				deletedCount = products.Count,
				productIds = targetProductIds
			});
		}
		catch
		{
			await tx.RollbackAsync();
			throw;
		}
	}

	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var products = await _db.Products
			.AsNoTracking()
			.OrderByDescending(p => p.CreatedAt)
			.Select(p => new ProductDetailDto
			{
				Id = p.Id,
				CategoryId = p.CategoryId,
				Slug = p.Slug,
				BasePrice = p.BasePrice,
				Status = p.Status ?? "",
				IsFeatured = p.IsFeatured,
				Images = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.ToList(),
				Variants = _db.ProductVariants
					.Where(v => v.ProductId == p.Id)
					.OrderBy(v => v.Id)
					.Select(v => new VariantDto
					{
						Id = v.Id,
						ProductId = v.ProductId,
						Sku = v.Sku,
						VariantName = v.VariantName,
						Price = v.Price,
						WeightGrams = v.WeightGrams,
						IsActive = v.IsActive,
						StockQuantity = 0
					})
					.ToList()
			})
			.ToListAsync();

		foreach (var product in products)
		{
			foreach (var variant in product.Variants)
			{
				variant.StockQuantity = await GetVariantStockAsync(variant.Id);
			}
		}

		var result = products.Select(p => new
		{
			p.Id,
			p.CategoryId,
			p.Slug,
			p.BasePrice,
			p.Status,
			p.IsFeatured,
			ImageUrl = p.Images.FirstOrDefault(),
			Images = p.Images,
			Variants = p.Variants
		});

		return Ok(result);
	}

	[HttpGet("{id:long}")]
	public async Task<IActionResult> GetById(long id)
	{
		var product = await _db.Products
			.AsNoTracking()
			.Where(p => p.Id == id)
			.Select(p => new ProductDetailDto
			{
				Id = p.Id,
				CategoryId = p.CategoryId,
				Slug = p.Slug,
				BasePrice = p.BasePrice,
				Status = p.Status ?? "",
				IsFeatured = p.IsFeatured,
				Images = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.ToList(),
				Variants = _db.ProductVariants
					.Where(v => v.ProductId == p.Id)
					.OrderBy(v => v.Id)
					.Select(v => new VariantDto
					{
						Id = v.Id,
						ProductId = v.ProductId,
						Sku = v.Sku,
						VariantName = v.VariantName,
						Price = v.Price,
						WeightGrams = v.WeightGrams,
						IsActive = v.IsActive,
						StockQuantity = 0
					})
					.ToList()
			})
			.FirstOrDefaultAsync();

		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		foreach (var variant in product.Variants)
		{
			variant.StockQuantity = await GetVariantStockAsync(variant.Id);
		}

		return Ok(new
		{
			product.Id,
			product.CategoryId,
			product.Slug,
			product.BasePrice,
			product.Status,
			product.IsFeatured,
			ImageUrl = product.Images.FirstOrDefault(),
			Images = product.Images,
			Variants = product.Variants
		});
	}

	[HttpPost]
	public async Task<IActionResult> Create([FromBody] ProductCreateUpdateDto dto)
	{
		var validationError = ValidateProductDto(dto);
		if (validationError != null) return validationError;

		var slug = dto.Slug.Trim();

		var existedSlug = await _db.Products.AnyAsync(x => x.Slug == slug);
		if (existedSlug)
			return BadRequest("Slug đã tồn tại.");

		var skuList = dto.Variants
			.Select(x => x.Sku.Trim())
			.ToList();

		var existedSku = await _db.ProductVariants
			.AnyAsync(x => skuList.Contains(x.Sku));

		if (existedSku)
			return BadRequest("Có SKU đã tồn tại trong hệ thống.");

		using var tx = await _db.Database.BeginTransactionAsync();

		try
		{
			var now = DateTime.Now;

			var product = new Product
			{
				CategoryId = dto.CategoryId,
				Slug = NormalizeVietnameseText(dto.Slug),
				BasePrice = dto.BasePrice,
				Status = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status.Trim(),
				IsFeatured = dto.IsFeatured,
				CreatedAt = now,
				UpdatedAt = now
			};

			_db.Products.Add(product);
			await _db.SaveChangesAsync();

			var urls = NormalizeImageUrls(dto.Images);
			foreach (var url in urls)
			{
				_db.ProductImages.Add(new ProductImage
				{
					ProductId = product.Id,
					ImageUrl = url
				});
			}
			await _db.SaveChangesAsync();

			foreach (var item in dto.Variants)
			{
				var variant = new ProductVariant
				{
					ProductId = product.Id,
					Sku = item.Sku.Trim(),
					VariantName = NormalizeVietnameseText(item.VariantName.Trim()),
					Price = item.Price ?? dto.BasePrice,
					WeightGrams = item.WeightGrams,
					IsActive = item.IsActive,
					CreatedAt = now
				};

				_db.ProductVariants.Add(variant);
				await _db.SaveChangesAsync();

				if (item.InitialStock > 0)
				{
					_db.InventoryTransactions.Add(new InventoryTransaction
					{
						VariantId = variant.Id,
						Type = "in",
						Quantity = item.InitialStock,
						ReferenceType = "product_create",
						ReferenceId = product.Id,
						Note = "Nhập kho ban đầu khi tạo sản phẩm",
						CreatedAt = now
					});
				}
			}

			await _db.SaveChangesAsync();
			await tx.CommitAsync();

			return await GetById(product.Id);
		}
		catch
		{
			await tx.RollbackAsync();
			throw;
		}
	}

	[HttpPut("{id:long}")]
	public async Task<IActionResult> Update(long id, [FromBody] ProductCreateUpdateDto dto)
	{
		if (dto == null)
			return BadRequest("Dữ liệu sản phẩm không hợp lệ.");

		if (string.IsNullOrWhiteSpace(dto.Slug))
			return BadRequest("Slug không được để trống.");

		if (dto.CategoryId <= 0)
			return BadRequest("CategoryId không hợp lệ.");

		if (dto.BasePrice == null)
			return BadRequest("Giá sản phẩm không được để trống.");

		if (dto.BasePrice < 0)
			return BadRequest("Giá sản phẩm không được âm.");

		if (dto.BasePrice > MAX_PRICE)
			return BadRequest($"Giá sản phẩm không được vượt quá {MAX_PRICE:N2}.");

		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		var slug = NormalizeVietnameseText(dto.Slug);

		var existedSlug = await _db.Products
			.AnyAsync(x => x.Id != id && x.Slug == slug);

		if (existedSlug)
			return BadRequest("Slug đã tồn tại.");

		product.Slug = slug;
		product.CategoryId = dto.CategoryId;
		product.BasePrice = dto.BasePrice;
		product.Status = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status.Trim();
		product.IsFeatured = dto.IsFeatured;
		product.UpdatedAt = DateTime.Now;

		await _db.SaveChangesAsync();

		if (dto.Images != null)
		{
			var urls = NormalizeImageUrls(dto.Images);

			var oldImages = await _db.ProductImages
				.Where(x => x.ProductId == id)
				.ToListAsync();

			if (oldImages.Count > 0)
			{
				_db.ProductImages.RemoveRange(oldImages);
			}

			foreach (var url in urls)
			{
				_db.ProductImages.Add(new ProductImage
				{
					ProductId = id,
					ImageUrl = url
				});
			}

			await _db.SaveChangesAsync();
		}

		return await GetById(id);
	}

	[HttpDelete("{id:long}")]
	public async Task<IActionResult> Delete(long id)
	{
		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		var images = await _db.ProductImages
			.Where(x => x.ProductId == id)
			.ToListAsync();

		if (images.Count > 0)
		{
			_db.ProductImages.RemoveRange(images);
		}

		var variants = await _db.ProductVariants
			.Where(x => x.ProductId == id)
			.ToListAsync();

		if (variants.Count > 0)
		{
			var variantIds = variants.Select(x => x.Id).ToList();

			var inventoryTransactions = await _db.InventoryTransactions
				.Where(x => variantIds.Contains(x.VariantId))
				.ToListAsync();

			if (inventoryTransactions.Count > 0)
			{
				_db.InventoryTransactions.RemoveRange(inventoryTransactions);
			}

			_db.ProductVariants.RemoveRange(variants);
		}

		_db.Products.Remove(product);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Deleted" });
	}
}