using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Common;
using SouvenirShop.DTOs.Product;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.User;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public ProductsController(SouvenirShopContext db) => _db = db;

	// ✅ Chỉ lọc cơ bản: keyword/category/price + sort + paging
	[HttpGet]
	public async Task<ActionResult<PagedResultDto<ProductSearchDto>>> Search(
		[FromQuery] string? keyword,
		[FromQuery] long? categoryId,
		[FromQuery] string? categoryIds,     // "1,2,3"
		[FromQuery] decimal? minPrice,
		[FromQuery] decimal? maxPrice,
		[FromQuery] string? sort = "newest",
		[FromQuery] int page = 1,
		[FromQuery] int pageSize = 12
	)
	{
		page = Math.Max(1, page);
		pageSize = Math.Clamp(pageSize, 1, 100);

		// Parse categoryIds
		List<long>? categoryIdList = null;
		if (!string.IsNullOrWhiteSpace(categoryIds))
		{
			categoryIdList = categoryIds
				.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
				.Select(x => long.TryParse(x, out var v) ? v : 0)
				.Where(v => v > 0)
				.Distinct()
				.ToList();

			if (categoryIdList.Count == 0) categoryIdList = null;
		}

		// Base query (products only)
		var query = _db.Products.AsNoTracking()
			.Where(p => p.Status == "active");

		// category
		if (categoryId.HasValue)
			query = query.Where(p => p.CategoryId == categoryId.Value);

		if (categoryIdList != null)
			query = query.Where(p => categoryIdList.Contains(p.CategoryId));

		// price
		if (minPrice.HasValue)
			query = query.Where(p => (p.BasePrice ?? 0) >= minPrice.Value);

		if (maxPrice.HasValue)
			query = query.Where(p => (p.BasePrice ?? 0) <= maxPrice.Value);

		// keyword: slug OR translations.name (nếu translations có dữ liệu null thì dùng ?? "")
		if (!string.IsNullOrWhiteSpace(keyword))
		{
			var kw = keyword.Trim().ToLower();
			query = query.Where(p =>
				p.Slug.ToLower().Contains(kw) ||
				_db.ProductTranslations.Any(t =>
					t.ProductId == p.Id && (t.Name ?? "").ToLower().Contains(kw))
			);
		}

		// sort
		sort = (sort ?? "newest").Trim().ToLowerInvariant();
		query = sort switch
		{
			"price_asc" => query.OrderBy(p => p.BasePrice ?? 0),
			"price_desc" => query.OrderByDescending(p => p.BasePrice ?? 0),
			_ => query.OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
		};

		var totalItems = await query.CountAsync();

		var items = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.Select(p => new ProductSearchDto
			{
				Id = p.Id,
				Slug = p.Slug,
				Price = p.BasePrice,
				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),
				AvgRating = 0,      // ✅ tạm bỏ rating
				ReviewCount = 0,    // ✅ tạm bỏ reviewCount
				InStock = true      // ✅ tạm bỏ stock (hoặc false)
			})
			.ToListAsync();

		return Ok(new PagedResultDto<ProductSearchDto>
		{
			Page = page,
			PageSize = pageSize,
			TotalItems = totalItems,
			Items = items
		});
	}
}