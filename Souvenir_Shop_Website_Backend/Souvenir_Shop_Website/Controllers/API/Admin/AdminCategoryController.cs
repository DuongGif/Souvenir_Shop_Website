using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.DTOs.Category;
using Souvenir_Shop_Website.Models;
using System;

[Route("api/[controller]")]
[ApiController]
public class AdminCategoriesController : ControllerBase
{
	private readonly SouvenirShopContext _context;

	public AdminCategoriesController(SouvenirShopContext context)
	{
		_context = context;
	}

	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var data = await _context.Categories
			.Include(x => x.CategoryTranslations)
			.Select(x => new
			{
				x.Id,
				x.Slug,
				x.IsVisible,
				Name = x.CategoryTranslations
					.Where(t => t.Language == "vi")
					.Select(t => t.Name)
					.FirstOrDefault()
			})
			.ToListAsync();

		return Ok(data);
	}

	// GET: api/categories/1
	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var category = await _context.Categories.FindAsync(id);

		if (category == null)
			return NotFound();

		return Ok(category);
	}

	[HttpPost]
	public async Task<IActionResult> Create(
	CreateCategoryDto dto)
	{
		var category = new Category
		{
			Slug = dto.Slug,
			ParentId = dto.ParentCategoryId,
			IsVisible = dto.IsVisible,
			CreatedAt = DateTime.UtcNow
		};

		foreach (var item in dto.Translations)
		{
			category.CategoryTranslations.Add(
				new CategoryTranslation
				{
					Language = item.Language,
					Name = item.Name,
					Description = item.Description,
					CreatedAt = DateTime.UtcNow
				});
		}

		_context.Categories.Add(category);

		await _context.SaveChangesAsync();

		return Ok(category.Id);
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(
	long id,
	UpdateCategoryDto dto)
	{
		var category = await _context.Categories
			.Include(x => x.CategoryTranslations)
			.FirstOrDefaultAsync(x => x.Id == id);

		if (category == null)
			return NotFound();

		category.Slug = dto.Slug;
		category.IsVisible = dto.IsVisible;

		_context.CategoryTranslations.RemoveRange(
			category.CategoryTranslations);

		category.CategoryTranslations.Clear();

		foreach (var item in dto.Translations)
		{
			category.CategoryTranslations.Add(
				new CategoryTranslation
				{
					Language = item.Language,
					Name = item.Name,
					Description = item.Description
				});
		}

		await _context.SaveChangesAsync();

		return Ok();
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(long id)
	{
		var hasProducts = await _context.Products
			.AnyAsync(x => x.CategoryId == id);

		if (hasProducts)
		{
			return BadRequest(
				"Danh mục đang chứa sản phẩm.");
		}

		var category = await _context.Categories
			.FindAsync(id);

		if (category == null)
			return NotFound();

		_context.Categories.Remove(category);

		await _context.SaveChangesAsync();

		return Ok();
	}
}