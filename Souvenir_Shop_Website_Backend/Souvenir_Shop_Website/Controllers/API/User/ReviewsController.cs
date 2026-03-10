using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Review;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public ReviewsController(SouvenirShopContext db) => _db = db;

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// POST /api/reviews
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] CreateReviewRequest req)
	{
		if (req.Rating < 1 || req.Rating > 5) return BadRequest("Rating must be 1..5");

		var userId = CurrentUserId();

		// (optional) xác thực đã mua: nếu bạn muốn thì check order_items thuộc user
		// var bought = await ...
		// if (!bought) return BadRequest("You must buy before reviewing.");

		var review = new Review
		{
			ProductId = req.ProductId,
			UserId = userId,
			Rating = req.Rating,
			Title = req.Title,
			Content = req.Content,
			Status = "pending", // chờ duyệt
			CreatedAt = DateTime.Now
		};

		_db.Reviews.Add(review);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Review submitted", reviewId = review.Id });
	}

	// GET /api/reviews/product/{productId}
	// Public xem được (bỏ Authorize bằng AllowAnonymous nếu muốn)
	[AllowAnonymous]
	[HttpGet("product/{productId:long}")]
	public async Task<ActionResult<List<ReviewDto>>> GetByProduct(long productId)
	{
		var data = await (from r in _db.Reviews.AsNoTracking()
						  where r.ProductId == productId && r.Status == "approved"
						  join rep in _db.ReviewReplies.AsNoTracking()
							  on r.Id equals rep.ReviewId into reps
						  from rep in reps.OrderByDescending(x => x.CreatedAt).Take(1).DefaultIfEmpty()
						  orderby r.CreatedAt descending
						  select new ReviewDto
						  {
							  Id = r.Id,
							  ProductId = r.ProductId,
							  Rating = r.Rating,
							  Title = r.Title,
							  Content = r.Content,
							  Status = r.Status,
							  CreatedAt = r.CreatedAt,
							  ReplyContent = rep != null ? rep.Content : null,
							  ReplyCreatedAt = rep != null ? rep.CreatedAt : null
						  }).ToListAsync();

		return Ok(data);
	}
}