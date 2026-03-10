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
	public AdminProductsController(SouvenirShopContext db) => _db = db;

	// GET all products (including hidden)
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var products = await _db.Products
			.OrderByDescending(p => p.CreatedAt)
			.ToListAsync();

		return Ok(products);
	}

	// POST create product
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] Product product)
	{
		product.CreatedAt = DateTime.Now;
		product.Status = "active";

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