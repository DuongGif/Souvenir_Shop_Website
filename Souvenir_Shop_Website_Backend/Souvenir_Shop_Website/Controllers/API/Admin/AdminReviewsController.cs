using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Review;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/reviews")]
public class AdminReviewsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AdminReviewsController(SouvenirShopContext db) => _db = db;

	private long CurrentAdminId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// GET /api/admin/reviews
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var data = await _db.Reviews.AsNoTracking()
			.OrderByDescending(r => r.CreatedAt)
			.Select(r => new
			{
				r.Id,
				r.ProductId,
				r.UserId,
				r.Rating,
				r.Title,
				r.Content,
				r.Status,
				r.CreatedAt
			})
			.ToListAsync();

		return Ok(data);
	}

	// POST /api/admin/reviews/{id}/reply
	[HttpPost("{id:long}/reply")]
	public async Task<IActionResult> Reply(long id, [FromBody] ReviewReplyRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Content))
			return BadRequest("Nội dung phản hồi là bắt buộc.");

		var review = await _db.Reviews.FindAsync(id);
		if (review == null)
			return NotFound("Không tìm thấy đánh giá.");

		var adminId = CurrentAdminId();

		var reply = new ReviewReply
		{
			ReviewId = review.Id,
			AdminUserId = adminId,
			Content = req.Content.Trim(),
			CreatedAt = DateTime.Now
		};

		_db.ReviewReplies.Add(reply);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Phản hồi đánh giá thành công." });
	}
}