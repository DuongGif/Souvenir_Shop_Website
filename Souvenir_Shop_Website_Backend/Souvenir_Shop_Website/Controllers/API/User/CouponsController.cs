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
			return BadRequest(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Mã giảm giá là bắt buộc."
			});

		var coupon = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
		if (coupon == null)
			return Ok(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Không tìm thấy mã giảm giá."
			});

		if (!coupon.IsActive)
			return Ok(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Mã giảm giá hiện không hoạt động."
			});

		var now = DateTime.Now;

		if (coupon.StartAt != null && now < coupon.StartAt)
			return Ok(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Mã giảm giá chưa đến thời gian sử dụng."
			});

		if (coupon.EndAt != null && now > coupon.EndAt)
			return Ok(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Mã giảm giá đã hết hạn."
			});

		if (coupon.MinimumOrderValue != null && req.Subtotal < coupon.MinimumOrderValue.Value)
			return Ok(new ValidateCouponResponse
			{
				IsValid = false,
				Message = "Giá trị đơn hàng chưa đủ để áp dụng mã giảm giá."
			});

		// giới hạn tổng số lần sử dụng
		if (coupon.TotalUsageLimit != null)
		{
			var used = await _db.OrderCoupons.CountAsync(x => x.CouponId == coupon.Id);
			if (used >= coupon.TotalUsageLimit.Value)
				return Ok(new ValidateCouponResponse
				{
					IsValid = false,
					Message = "Mã giảm giá đã hết lượt sử dụng."
				});
		}

		// giới hạn số lần sử dụng theo người dùng
		if (coupon.PerUserLimit != null)
		{
			var usedByUser = await (
				from oc in _db.OrderCoupons
				join o in _db.Orders on oc.OrderId equals o.Id
				where oc.CouponId == coupon.Id && o.UserId == userId
				select oc.Id
			).CountAsync();

			if (usedByUser >= coupon.PerUserLimit.Value)
				return Ok(new ValidateCouponResponse
				{
					IsValid = false,
					Message = "Bạn đã dùng hết số lần sử dụng mã giảm giá này."
				});
		}

		// tính tiền giảm giá (giảm phí ship tạm thời xử lý giả lập ở đây)
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
			if (discount > req.Subtotal)
				discount = req.Subtotal;
		}
		else if (coupon.Type == "free_shipping")
		{
			// bạn có thể xử lý giảm phí vận chuyển ở bước tạo đơn hàng
			// ở đây chỉ đánh dấu là được miễn phí vận chuyển
			shippingDiscount = 1;
		}

		return Ok(new ValidateCouponResponse
		{
			IsValid = true,
			Message = "Mã giảm giá hợp lệ.",
			DiscountAmount = discount,
			ShippingDiscount = shippingDiscount
		});
	}
}