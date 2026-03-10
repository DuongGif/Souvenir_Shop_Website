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

	// GET /api/products?keyword=&categoryId=&categoryIds=1,2,3&minPrice=&maxPrice=&minRating=&inStockOnly=&sort=&page=&pageSize=
	[HttpGet]
	public async Task<ActionResult<PagedResultDto<ProductSearchDto>>> Search(
		[FromQuery] string? keyword,
		[FromQuery] long? categoryId,
		[FromQuery] string? categoryIds,     // "1,2,3"
		[FromQuery] decimal? minPrice,
		[FromQuery] decimal? maxPrice,
		[FromQuery] decimal? minRating,      // ví dụ 4.0
		[FromQuery] bool? inStockOnly,       // true -> chỉ lấy còn hàng
		[FromQuery] string? sort = "newest", // newest | price_asc | price_desc | rating_desc | rating_asc
		[FromQuery] int page = 1,
		[FromQuery] int pageSize = 12
	)
	{
		page = Math.Max(1, page);
		pageSize = Math.Clamp(pageSize, 1, 100);

		// ==== Parse categoryIds ====
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

		// ==== Base query (active products) ====
		var baseQuery = _db.Products.AsNoTracking()
			.Where(p => p.Status == "active");

		// filter category (1 id)
		if (categoryId.HasValue)
			baseQuery = baseQuery.Where(p => p.CategoryId == categoryId.Value);

		// filter multiple categories
		if (categoryIdList != null)
			baseQuery = baseQuery.Where(p => categoryIdList.Contains(p.CategoryId));

		// filter price (base price)
		if (minPrice.HasValue)
			baseQuery = baseQuery.Where(p => (p.BasePrice ?? 0) >= minPrice.Value);
		if (maxPrice.HasValue)
			baseQuery = baseQuery.Where(p => (p.BasePrice ?? 0) <= maxPrice.Value);

		// ==== Search keyword: slug OR product_translations.name ====
		if (!string.IsNullOrWhiteSpace(keyword))
		{
			var kw = keyword.Trim().ToLower();

			baseQuery = baseQuery.Where(p =>
				p.Slug.ToLower().Contains(kw)
				|| _db.ProductTranslations.Any(t =>
					t.ProductId == p.Id && t.Name.ToLower().Contains(kw))
			);
		}

		// ==== Rating subquery (approved only) ====
		var ratingQuery =
			from r in _db.Reviews.AsNoTracking()
			where r.Status == "approved"
			group r by r.ProductId into g
			select new
			{
				ProductId = g.Key,
				AvgRating = g.Average(x => (decimal)x.Rating),
				ReviewCount = g.Count()
			};

		// ==== Stock subquery (inventory_transactions) ====
		// Quy ước: import => +quantity, export => -quantity, adjust => +quantity (có thể âm/dương)
		var stockQuery =
			from it in _db.InventoryTransactions.AsNoTracking()
			join v in _db.ProductVariants.AsNoTracking() on it.VariantId equals v.Id
			where v.IsActive == true
			group new { it, v } by v.ProductId into g
			select new
			{
				ProductId = g.Key,
				Stock = g.Sum(x =>
					x.it.Type == "import" ? x.it.Quantity :
					x.it.Type == "export" ? -x.it.Quantity :
					x.it.Quantity // adjust
				)
			};

		// ==== Merge base + rating + stock ====
		var query =
			from p in baseQuery
			join rt in ratingQuery on p.Id equals rt.ProductId into rts
			from rt in rts.DefaultIfEmpty()
			join st in stockQuery on p.Id equals st.ProductId into sts
			from st in sts.DefaultIfEmpty()
			select new
			{
				Product = p,
				AvgRating = rt != null ? rt.AvgRating : 0m,
				ReviewCount = rt != null ? rt.ReviewCount : 0,
				Stock = st != null ? st.Stock : 0
			};

		// filter minRating
		if (minRating.HasValue)
			query = query.Where(x => x.AvgRating >= minRating.Value);

		// filter inStockOnly
		if (inStockOnly == true)
			query = query.Where(x => x.Stock > 0);

		// sorting
		sort = (sort ?? "newest").Trim().ToLowerInvariant();
		query = sort switch
		{
			"price_asc" => query.OrderBy(x => x.Product.BasePrice ?? 0),
			"price_desc" => query.OrderByDescending(x => x.Product.BasePrice ?? 0),
			"rating_asc" => query.OrderBy(x => x.AvgRating).ThenByDescending(x => x.Product.CreatedAt),
			"rating_desc" => query.OrderByDescending(x => x.AvgRating).ThenByDescending(x => x.Product.CreatedAt),
			_ => query.OrderByDescending(x => x.Product.CreatedAt)
		};

		var totalItems = await query.CountAsync();

		var items = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.Select(x => new ProductSearchDto
			{
				Id = x.Product.Id,
				Slug = x.Product.Slug,
				Price = x.Product.BasePrice,
				ImageUrl = _db.ProductImages
					.Where(i => i.ProductId == x.Product.Id)
					.Select(i => i.ImageUrl)
					.FirstOrDefault(),
				AvgRating = x.AvgRating,
				ReviewCount = x.ReviewCount,
				InStock = x.Stock > 0
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