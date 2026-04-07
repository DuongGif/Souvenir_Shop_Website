using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/products")]
public class AdminProductsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly IWebHostEnvironment _env;

	// Đổi giá trị này nếu cột base_price trong DB của bạn lớn hơn/nhỏ hơn.
	// Với decimal(12,2) thì giá tối đa an toàn là 9,999,999,999.99
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

	private IActionResult? ValidateProduct(Product product)
	{
		if (product == null)
			return BadRequest("Dữ liệu sản phẩm không hợp lệ.");

		if (string.IsNullOrWhiteSpace(product.Slug))
			return BadRequest("Slug không được để trống.");

		if (product.CategoryId <= 0)
			return BadRequest("CategoryId không hợp lệ.");

		if (product.BasePrice < 0)
			return BadRequest("Giá sản phẩm không được âm.");

		if (product.BasePrice > MAX_PRICE)
			return BadRequest($"Giá sản phẩm không được vượt quá {MAX_PRICE:N2}.");

		return null;
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

	// GET all products (including hidden) + first image + all images
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var products = await _db.Products
			.AsNoTracking()
			.OrderByDescending(p => p.CreatedAt)
			.Select(p => new
			{
				p.Id,
				p.CategoryId,
				p.Slug,
				p.BasePrice,
				p.Status,
				p.IsFeatured,
				p.CreatedAt,
				p.UpdatedAt,

				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),

				Images = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.ToList()
			})
			.ToListAsync();

		return Ok(products);
	}

	// GET one product + images
	[HttpGet("{id:long}")]
	public async Task<IActionResult> GetById(long id)
	{
		var product = await _db.Products
			.AsNoTracking()
			.Where(p => p.Id == id)
			.Select(p => new
			{
				p.Id,
				p.CategoryId,
				p.Slug,
				p.BasePrice,
				p.Status,
				p.IsFeatured,
				p.CreatedAt,
				p.UpdatedAt,
				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),
				Images = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.ToList()
			})
			.FirstOrDefaultAsync();

		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		return Ok(product);
	}

	// POST create product
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] Product product)
	{
		var validationError = ValidateProduct(product);
		if (validationError != null) return validationError;

		var existedSlug = await _db.Products.AnyAsync(x => x.Slug == product.Slug);
		if (existedSlug)
			return BadRequest("Slug đã tồn tại.");

		product.CreatedAt = DateTime.Now;
		product.UpdatedAt = DateTime.Now;
		product.Status = string.IsNullOrWhiteSpace(product.Status) ? "active" : product.Status.Trim();

		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		return Ok(product);
	}

	// PUT update product
	[HttpPut("{id:long}")]
	public async Task<IActionResult> Update(long id, [FromBody] Product updated)
	{
		if (updated == null)
			return BadRequest("Dữ liệu sản phẩm không hợp lệ.");

		var validationError = ValidateProduct(updated);
		if (validationError != null) return validationError;

		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound("Không tìm thấy sản phẩm.");

		var existedSlug = await _db.Products
			.AnyAsync(x => x.Id != id && x.Slug == updated.Slug);

		if (existedSlug)
			return BadRequest("Slug đã tồn tại.");

		product.Slug = updated.Slug.Trim();
		product.CategoryId = updated.CategoryId;
		product.BasePrice = updated.BasePrice;
		product.Status = string.IsNullOrWhiteSpace(updated.Status) ? "active" : updated.Status.Trim();
		product.IsFeatured = updated.IsFeatured;
		product.UpdatedAt = DateTime.Now;

		await _db.SaveChangesAsync();
		return Ok(product);
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

		_db.Products.Remove(product);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Deleted" });
	}
}