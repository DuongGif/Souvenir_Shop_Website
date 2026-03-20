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

	public AdminProductsController(SouvenirShopContext db, IWebHostEnvironment env)
	{
		_db = db;
		_env = env;
	}

	[HttpPut("{id:long}/images")]
	public async Task<IActionResult> ReplaceImages(long id, [FromBody] List<string> imageUrls)
	{
		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound();

		// Xóa toàn bộ ảnh cũ
		var oldImages = await _db.ProductImages
			.Where(x => x.ProductId == id)
			.ToListAsync();

		if (oldImages.Count > 0)
		{
			_db.ProductImages.RemoveRange(oldImages);
		}

		// Thêm ảnh mới
		foreach (var url in imageUrls.Where(x => !string.IsNullOrWhiteSpace(x)))
		{
			_db.ProductImages.Add(new ProductImage
			{
				ProductId = id,
				ImageUrl = url.Trim()
			});
		}

		await _db.SaveChangesAsync();

		return Ok(new { message = "Images replaced" });
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
		if (product == null) return NotFound();

		foreach (var url in imageUrls.Where(x => !string.IsNullOrWhiteSpace(x)))
		{
			_db.ProductImages.Add(new ProductImage
			{
				ProductId = id,
				ImageUrl = url.Trim()
			});
		}

		await _db.SaveChangesAsync();
		return Ok(new { message = "Images added" });
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

				// ảnh đầu tiên để show trong list
				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),

				// toàn bộ ảnh để dùng nếu cần
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

		if (product == null) return NotFound();

		return Ok(product);
	}

	// POST create product
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] Product product)
	{
		product.CreatedAt = DateTime.Now;
		product.Status ??= "active";

		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		return Ok(product);
	}

	// PUT update product
	[HttpPut("{id:long}")]
	public async Task<IActionResult> Update(long id, [FromBody] Product updated)
	{
		var product = await _db.Products.FindAsync(id);
		if (product == null) return NotFound();

		product.Slug = updated.Slug;
		product.CategoryId = updated.CategoryId;
		product.BasePrice = updated.BasePrice;
		product.Status = updated.Status;
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
		if (product == null) return NotFound();

		_db.Products.Remove(product);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Deleted" });
	}
}