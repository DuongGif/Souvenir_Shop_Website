using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Coupon;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/coupons")]
public class AdminCouponsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AdminCouponsController(SouvenirShopContext db) => _db = db;

	// GET /api/admin/coupons
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var data = await _db.Coupons.AsNoTracking()
			.OrderByDescending(x => x.CreatedAt)
			.Select(x => new CouponDto
			{
				Code = x.Code,
				Type = x.Type,
				Value = x.Value,
				MinimumOrderValue = x.MinimumOrderValue,
				MaximumDiscount = x.MaximumDiscount,
				StartAt = x.StartAt,
				EndAt = x.EndAt,
				TotalUsageLimit = x.TotalUsageLimit,
				PerUserLimit = x.PerUserLimit,
				IsActive = x.IsActive
			})
			.ToListAsync();

		return Ok(data);
	}

	// GET /api/admin/coupons/{code}
	[HttpGet("{code}")]
	public async Task<IActionResult> GetByCode(string code)
	{
		code = code.Trim().ToUpperInvariant();

		var c = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
		if (c == null) return NotFound();

		return Ok(new CouponDto
		{
			Code = c.Code,
			Type = c.Type,
			Value = c.Value,
			MinimumOrderValue = c.MinimumOrderValue,
			MaximumDiscount = c.MaximumDiscount,
			StartAt = c.StartAt,
			EndAt = c.EndAt,
			TotalUsageLimit = c.TotalUsageLimit,
			PerUserLimit = c.PerUserLimit,
			IsActive = c.IsActive
		});
	}

	// POST /api/admin/coupons
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] CreateCouponRequest req)
	{
		var code = req.Code.Trim().ToUpperInvariant();
		if (string.IsNullOrWhiteSpace(code)) return BadRequest("Code is required.");

		var exists = await _db.Coupons.AnyAsync(x => x.Code == code);
		if (exists) return BadRequest("Coupon code already exists.");

		var allowed = new HashSet<string> { "percentage", "fixed", "free_shipping" };
		var type = req.Type.Trim().ToLowerInvariant();
		if (!allowed.Contains(type)) return BadRequest("Type must be: percentage/fixed/free_shipping.");

		if (req.Value <= 0) return BadRequest("Value must be > 0.");

		var coupon = new Coupon
		{
			Code = code,
			Type = type,
			Value = req.Value,
			MinimumOrderValue = req.MinimumOrderValue,
			MaximumDiscount = req.MaximumDiscount,
			StartAt = req.StartAt,
			EndAt = req.EndAt,
			TotalUsageLimit = req.TotalUsageLimit,
			PerUserLimit = req.PerUserLimit,
			IsActive = req.IsActive,
			CreatedAt = DateTime.Now
		};

		_db.Coupons.Add(coupon);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Created", code = coupon.Code });
	}

	// PUT /api/admin/coupons/{code}
	[HttpPut("{code}")]
	public async Task<IActionResult> Update(string code, [FromBody] UpdateCouponRequest req)
	{
		code = code.Trim().ToUpperInvariant();

		var coupon = await _db.Coupons.FirstOrDefaultAsync(x => x.Code == code);
		if (coupon == null) return NotFound();

		var allowed = new HashSet<string> { "percentage", "fixed", "free_shipping" };
		var type = req.Type.Trim().ToLowerInvariant();
		if (!allowed.Contains(type)) return BadRequest("Type must be: percentage/fixed/free_shipping.");

		if (req.Value <= 0) return BadRequest("Value must be > 0.");

		coupon.Type = type;
		coupon.Value = req.Value;
		coupon.MinimumOrderValue = req.MinimumOrderValue;
		coupon.MaximumDiscount = req.MaximumDiscount;
		coupon.StartAt = req.StartAt;
		coupon.EndAt = req.EndAt;
		coupon.TotalUsageLimit = req.TotalUsageLimit;
		coupon.PerUserLimit = req.PerUserLimit;
		coupon.IsActive = req.IsActive;

		await _db.SaveChangesAsync();
		return Ok(new { message = "Updated", code = coupon.Code });
	}

	// DELETE /api/admin/coupons/{code}
	[HttpDelete("{code}")]
	public async Task<IActionResult> Delete(string code)
	{
		code = code.Trim().ToUpperInvariant();

		var coupon = await _db.Coupons.FirstOrDefaultAsync(x => x.Code == code);
		if (coupon == null) return NotFound();

		_db.Coupons.Remove(coupon);
		await _db.SaveChangesAsync();
		return Ok(new { message = "Deleted", code });
	}
}