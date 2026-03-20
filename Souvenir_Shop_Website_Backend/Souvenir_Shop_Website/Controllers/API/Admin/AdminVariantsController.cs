using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Product;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/products/{productId:long}/variants")]
public class AdminVariantsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AdminVariantsController(SouvenirShopContext db) => _db = db;

	// GET: api/admin/products/{productId}/variants
	[HttpGet]
	public async Task<IActionResult> GetAll(long productId)
	{
		var productExists = await _db.Products.AnyAsync(p => p.Id == productId);
		if (!productExists)
			return NotFound(new { message = "Product not found" });

		var variants = await _db.ProductVariants
			.Where(v => v.ProductId == productId)
			.OrderBy(v => v.Id)
			.Select(v => new VariantDto
			{
				Id = v.Id,
				Sku = v.Sku,
				VariantName = v.VariantName,
				Price = v.Price,
				IsActive = v.IsActive
			})
			.ToListAsync();

		return Ok(variants);
	}

	// GET: api/admin/products/{productId}/variants/{id}
	[HttpGet("{id:long}")]
	public async Task<IActionResult> GetById(long productId, long id)
	{
		var variant = await _db.ProductVariants
			.Where(v => v.ProductId == productId && v.Id == id)
			.Select(v => new VariantDto
			{
				Id = v.Id,
				Sku = v.Sku,
				VariantName = v.VariantName,
				Price = v.Price,
				IsActive = v.IsActive
			})
			.FirstOrDefaultAsync();

		if (variant == null)
			return NotFound(new { message = "Variant not found" });

		return Ok(variant);
	}

	// POST: api/admin/products/{productId}/variants
	[HttpPost]
	public async Task<IActionResult> Create(long productId, [FromBody] VariantCreateUpdateDto dto)
	{
		var product = await _db.Products.FindAsync(productId);
		if (product == null)
			return NotFound(new { message = "Product not found" });

		if (string.IsNullOrWhiteSpace(dto.Sku))
			return BadRequest(new { message = "SKU is required" });

		if (string.IsNullOrWhiteSpace(dto.VariantName))
			return BadRequest(new { message = "Variant name is required" });

		var skuExists = await _db.ProductVariants.AnyAsync(v => v.Sku == dto.Sku.Trim());
		if (skuExists)
			return BadRequest(new { message = "SKU already exists" });

		var variant = new ProductVariant
		{
			ProductId = productId,
			Sku = dto.Sku.Trim(),
			VariantName = dto.VariantName.Trim(),
			Price = dto.Price,
			WeightGrams = dto.WeightGrams,
			IsActive = dto.IsActive,
			CreatedAt = DateTime.Now
		};

		_db.ProductVariants.Add(variant);
		await _db.SaveChangesAsync();

		var result = new VariantDto
		{
			Id = variant.Id,
			Sku = variant.Sku,
			VariantName = variant.VariantName,
			Price = variant.Price,
			IsActive = variant.IsActive
		};

		return Ok(result);
	}

	// PUT: api/admin/products/{productId}/variants/{id}
	[HttpPut("{id:long}")]
	public async Task<IActionResult> Update(long productId, long id, [FromBody] VariantCreateUpdateDto dto)
	{
		var variant = await _db.ProductVariants
			.FirstOrDefaultAsync(v => v.ProductId == productId && v.Id == id);

		if (variant == null)
			return NotFound(new { message = "Variant not found" });

		if (string.IsNullOrWhiteSpace(dto.Sku))
			return BadRequest(new { message = "SKU is required" });

		if (string.IsNullOrWhiteSpace(dto.VariantName))
			return BadRequest(new { message = "Variant name is required" });

		var skuExists = await _db.ProductVariants
			.AnyAsync(v => v.Id != id && v.Sku == dto.Sku.Trim());

		if (skuExists)
			return BadRequest(new { message = "SKU already exists" });

		variant.Sku = dto.Sku.Trim();
		variant.VariantName = dto.VariantName.Trim();
		variant.Price = dto.Price;
		variant.WeightGrams = dto.WeightGrams;
		variant.IsActive = dto.IsActive;

		await _db.SaveChangesAsync();

		var result = new VariantDto
		{
			Id = variant.Id,
			Sku = variant.Sku,
			VariantName = variant.VariantName,
			Price = variant.Price,
			IsActive = variant.IsActive
		};

		return Ok(result);
	}

	// DELETE: api/admin/products/{productId}/variants/{id}
	[HttpDelete("{id:long}")]
	public async Task<IActionResult> Delete(long productId, long id)
	{
		var variant = await _db.ProductVariants
			.FirstOrDefaultAsync(v => v.ProductId == productId && v.Id == id);

		if (variant == null)
			return NotFound(new { message = "Variant not found" });

		_db.ProductVariants.Remove(variant);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Deleted" });
	}
}