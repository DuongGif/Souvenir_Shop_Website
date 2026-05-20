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

	// GET /api/products/{id}
	[HttpGet("{id:long}")]
	public async Task<ActionResult<ProductDetailDto>> GetById(long id)
	{
		var product = await _db.Products.AsNoTracking()
			.Where(p => p.Id == id && p.Status == "active")
			.Select(p => new ProductDetailDto
			{
				Id = p.Id,
				Slug = p.Slug,
				BasePrice = p.BasePrice,
				Images = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.OrderBy(i => i.Id)
					.Select(i => i.ImageUrl)
					.ToList(),
				Variants = _db.ProductVariants
					.Where(v => v.ProductId == p.Id && v.IsActive)
					.OrderBy(v => v.Id)
					.Select(v => new VariantDto
					{
						Id = v.Id,
						Sku = v.Sku,
						VariantName = v.VariantName,
						Price = v.Price,
						IsActive = v.IsActive
					})
					.ToList()
			})
			.FirstOrDefaultAsync();

		if (product == null) return NotFound();

		return Ok(product);
	}
	// GET /api/products/all
	[HttpGet("all")]
	public async Task<ActionResult<List<ProductSearchDto>>> GetAll()
	{
		// ✅ an toàn: chỉ lấy product cơ bản, tránh join reviews/inventory
		var items = await _db.Products.AsNoTracking()
			.Where(p => p.Status == "active")
			.Select(p => new ProductSearchDto
			{
				Id = p.Id,
				CategoryId = p.CategoryId,
				CreatedAt = p.CreatedAt,
				Slug = p.Slug,
				Price = p.BasePrice,
				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == p.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),
				// Thay AvgRating = 0 và ReviewCount = 0 bằng:
				AvgRating = _db.Reviews.Where(r => r.ProductId == p.Id && r.Status == "approved").Average(r => (decimal?)r.Rating) ?? 0,
				ReviewCount = _db.Reviews.Count(r => r.ProductId == p.Id && r.Status == "approved"),   // tạm
				InStock = true      // tạm
			})
			.ToListAsync();

		return Ok(items);
	}

	// ✅ Chỉ lọc cơ bản: keyword/category/price + sort + paging
	[HttpGet]
	public async Task<ActionResult<PagedResultDto<ProductSearchDto>>> Search(
		[FromQuery] string? keyword,
		[FromQuery] long? categoryId,
		[FromQuery] string? categoryIds,     // "1,2,3"
		[FromQuery] decimal? minPrice,
		[FromQuery] decimal? maxPrice,
		[FromQuery] double? minRating,
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
		if (minRating.HasValue && minRating.Value > 0)
		{
			query = query.Where(p =>
				_db.Reviews
					.Where(r => r.ProductId == p.Id && r.Status == "approved")
					.Any()
				&&
				_db.Reviews
					.Where(r => r.ProductId == p.Id && r.Status == "approved")
					.Average(r => (double)r.Rating) >= minRating.Value
			);
		}
		// sort
		sort = (sort ?? "newest").Trim().ToLowerInvariant();

		// Sort theo rating cần join sau khi lấy dữ liệu vì AvgRating là subquery
		var baseQuery = sort switch
		{
			"price_asc" => query.OrderBy(p => p.BasePrice ?? 0),
			"price_desc" => query.OrderByDescending(p => p.BasePrice ?? 0),
			"rating_desc" => query.OrderByDescending(p =>
								  _db.Reviews
									 .Where(r => r.ProductId == p.Id && r.Status == "approved")
									 .Average(r => (double?)r.Rating) ?? 0),
			"rating_asc" => query.OrderBy(p =>
								  _db.Reviews
									 .Where(r => r.ProductId == p.Id && r.Status == "approved")
									 .Average(r => (double?)r.Rating) ?? 0),
			_ => query.OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
		};
		var totalItems = await baseQuery.CountAsync();

		var items = await baseQuery
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
				AvgRating = _db.Reviews.Where(r => r.ProductId == p.Id && r.Status == "approved").Average(r => (decimal?)r.Rating) ?? 0,
				ReviewCount = _db.Reviews.Count(r => r.ProductId == p.Id && r.Status == "approved"),   // tạm
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