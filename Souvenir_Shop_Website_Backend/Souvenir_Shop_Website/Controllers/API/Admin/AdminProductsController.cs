using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Product;
using Souvenir_Shop_Website.Models;

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
		// Nếu model InventoryTransaction của bạn có tên field khác
		// thì đổi lại cho đúng scaffold hiện tại.
		return await _db.InventoryTransactions
			.Where(x => x.VariantId == variantId)
			.SumAsync(x => (int?)x.Quantity) ?? 0;
	}

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

	// GET all products + first image + all images + variants
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

	// GET one product + images + variants
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

	// POST create product + at least 1 variant
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
				Slug = slug,
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
					VariantName = item.VariantName.Trim(),
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

	// PUT update product info only
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

		var slug = dto.Slug.Trim();

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

		// Không update variants ở đây.
		// Variants nên quản lý ở API riêng để tránh xóa/sửa nhầm dữ liệu tồn kho.

		return await GetById(id);
	}

	// DELETE product
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