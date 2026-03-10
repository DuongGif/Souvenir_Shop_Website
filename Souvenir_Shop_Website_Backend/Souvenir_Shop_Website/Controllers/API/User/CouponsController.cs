using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Coupon;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/coupons")]
public class CouponsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public CouponsController(SouvenirShopContext db) => _db = db;

	private long CurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// POST /api/coupons/validate
	[HttpPost("validate")]
	public async Task<ActionResult<ValidateCouponResponse>> Validate([FromBody] ValidateCouponRequest req)
	{
		var userId = CurrentUserId();
		var code = (req.Code ?? "").Trim().ToUpperInvariant();

		if (string.IsNullOrWhiteSpace(code))
			return BadRequest(new ValidateCouponResponse { IsValid = false, Message = "Code is required." });

		var coupon = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
		if (coupon == null)
			return Ok(new ValidateCouponResponse { IsValid = false, Message = "Coupon not found." });

		if (!coupon.IsActive)
			return Ok(new ValidateCouponResponse { IsValid = false, Message = "Coupon is not active." });

		var now = DateTime.Now;
		if (coupon.StartAt != null && now < coupon.StartAt)
			return Ok(new ValidateCouponResponse { IsValid = false, Message = "Coupon not started yet." });

		if (coupon.EndAt != null && now > coupon.EndAt)
			return Ok(new ValidateCouponResponse { IsValid = false, Message = "Coupon expired." });

		if (coupon.MinimumOrderValue != null && req.Subtotal < coupon.MinimumOrderValue.Value)
			return Ok(new ValidateCouponResponse { IsValid = false, Message = "Order value is too low." });

		// total usage limit
		if (coupon.TotalUsageLimit != null)
		{
			var used = await _db.OrderCoupons.CountAsync(x => x.CouponId == coupon.Id);
			if (used >= coupon.TotalUsageLimit.Value)
				return Ok(new ValidateCouponResponse { IsValid = false, Message = "Coupon usage limit reached." });
		}

		// per user limit
		if (coupon.PerUserLimit != null)
		{
			var usedByUser = await (from oc in _db.OrderCoupons
									join o in _db.Orders on oc.OrderId equals o.Id
									where oc.CouponId == coupon.Id && o.UserId == userId
									select oc.Id).CountAsync();

			if (usedByUser >= coupon.PerUserLimit.Value)
				return Ok(new ValidateCouponResponse { IsValid = false, Message = "You have reached coupon usage limit." });
		}

		// Calculate discount (shipping discount mock = 0 ở đây)
		decimal discount = 0;
		decimal shippingDiscount = 0;

		if (coupon.Type == "percentage")
		{
			discount = req.Subtotal * (coupon.Value / 100m);
			if (coupon.MaximumDiscount != null)
				discount = Math.Min(discount, coupon.MaximumDiscount.Value);
		}
		else if (coupon.Type == "fixed")
		{
			discount = coupon.Value;
			if (discount > req.Subtotal) discount = req.Subtotal;
		}
		else if (coupon.Type == "free_shipping")
		{
			// bạn có thể xử lý giảm phí ship ở bước tạo order (ở đây chỉ báo là free shipping)
			shippingDiscount = 1;
		}

		return Ok(new ValidateCouponResponse
		{
			IsValid = true,
			Message = "Valid",
			DiscountAmount = discount,
			ShippingDiscount = shippingDiscount
		});
	}
}