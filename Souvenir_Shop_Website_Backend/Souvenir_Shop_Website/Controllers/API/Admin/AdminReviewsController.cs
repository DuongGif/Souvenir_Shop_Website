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

	// GET /api/admin/reviews?status=pending
	[HttpGet]
	public async Task<IActionResult> GetAll([FromQuery] string? status = "pending")
	{
		status ??= "pending";

		var data = await _db.Reviews.AsNoTracking()
			.Where(r => r.Status == status)
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

	// PUT /api/admin/reviews/{id}/approve
	[HttpPut("{id:long}/approve")]
	public async Task<IActionResult> Approve(long id)
	{
		var review = await _db.Reviews.FindAsync(id);
		if (review == null) return NotFound();

		review.Status = "approved";
		await _db.SaveChangesAsync();

		return Ok(new { message = "Approved" });
	}

	// PUT /api/admin/reviews/{id}/reject
	[HttpPut("{id:long}/reject")]
	public async Task<IActionResult> Reject(long id)
	{
		var review = await _db.Reviews.FindAsync(id);
		if (review == null) return NotFound();

		review.Status = "rejected";
		await _db.SaveChangesAsync();

		return Ok(new { message = "Rejected" });
	}

	// POST /api/admin/reviews/{id}/reply
	[HttpPost("{id:long}/reply")]
	public async Task<IActionResult> Reply(long id, [FromBody] ReviewReplyRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Content))
			return BadRequest("Content is required.");

		var review = await _db.Reviews.FindAsync(id);
		if (review == null) return NotFound();

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

		return Ok(new { message = "Replied" });
	}
}