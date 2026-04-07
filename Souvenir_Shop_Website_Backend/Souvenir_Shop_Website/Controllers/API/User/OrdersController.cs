using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Order;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
	private readonly SouvenirShopContext _db;

	// Nếu DB của bạn là decimal(12,2) thì mức này là an toàn
	private const decimal MAX_MONEY = 9999999999.99m;
	private const int MAX_ITEM_QTY = 1000;

	public OrdersController(SouvenirShopContext db) => _db = db;

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	private string? ValidateMoney(decimal value, string fieldName)
	{
		if (value < 0)
			return $"{fieldName} không được âm.";

		if (value > MAX_MONEY)
			return $"{fieldName} vượt quá giới hạn cho phép.";

		return null;
	}

	[HttpPost]
	public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderRequest req)
	{
		var userId = CurrentUserId();

		if (req.FulfillmentType == "delivery" || req.FulfillmentType == "hotel")
		{
			if (req.ShippingAddressId == null || req.ShippingAddressId <= 0)
				return BadRequest("ShippingAddressId is required.");

			var addressOk = await _db.Addresses
				.AnyAsync(a => a.Id == req.ShippingAddressId && a.UserId == userId);

			if (!addressOk)
				return BadRequest("Invalid shippingAddressId.");
		}

		var cart = await _db.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
		if (cart == null)
			return BadRequest("Cart not found.");

		var cartItems = await (
			from ci in _db.CartItems
			join v in _db.ProductVariants on ci.VariantId equals v.Id
			join p in _db.Products on v.ProductId equals p.Id
			where ci.CartId == cart.Id && v.IsActive == true
			select new
			{
				ci,
				v,
				p,
				UnitPrice = (decimal)(v.Price ?? p.BasePrice ?? 0)
			}
		).ToListAsync();

		if (cartItems.Count == 0)
			return BadRequest("Cart is empty.");

		foreach (var x in cartItems)
		{
			if (x.ci.Quantity <= 0)
				return BadRequest($"Số lượng không hợp lệ cho sản phẩm ");

			if (x.ci.Quantity > MAX_ITEM_QTY)
				return BadRequest($"Số lượng vượt quá giới hạn cho phép cho sản phẩm ");

			if (x.UnitPrice < 0)
				return BadRequest($"Giá không hợp lệ cho sản phẩm ");

			if (x.UnitPrice > MAX_MONEY)
				return BadRequest($"Giá sản phẩm quá lớn cho sản phẩm ");

			var lineTotal = x.UnitPrice * x.ci.Quantity;
			if (lineTotal > MAX_MONEY)
				return BadRequest("Thành tiền của một sản phẩm vượt quá giới hạn cho phép.");
		}

		await using var tx = await _db.Database.BeginTransactionAsync();

		try
		{
			var subtotal = cartItems.Sum(x => x.UnitPrice * x.ci.Quantity);

			var subtotalError = ValidateMoney(subtotal, "Subtotal");
			if (subtotalError != null)
				return BadRequest(subtotalError);

			var shippingFee = 0m;

			var shippingFeeError = ValidateMoney(shippingFee, "ShippingFee");
			if (shippingFeeError != null)
				return BadRequest(shippingFeeError);

			decimal discountAmount = 0m;
			decimal shippingDiscount = 0m;

			Coupon? coupon = null;

			var couponCode = (req.CouponCode ?? "").Trim().ToUpperInvariant();
			if (!string.IsNullOrWhiteSpace(couponCode))
			{
				coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == couponCode);
				if (coupon == null)
					return BadRequest("Coupon not found.");

				if (!coupon.IsActive)
					return BadRequest("Coupon is not active.");

				var now = DateTime.Now;
				if (coupon.StartAt != null && now < coupon.StartAt)
					return BadRequest("Coupon not started yet.");

				if (coupon.EndAt != null && now > coupon.EndAt)
					return BadRequest("Coupon expired.");

				if (coupon.MinimumOrderValue != null && subtotal < coupon.MinimumOrderValue.Value)
					return BadRequest("Order value is too low for this coupon.");

				if (coupon.TotalUsageLimit != null)
				{
					var used = await _db.OrderCoupons.CountAsync(oc => oc.CouponId == coupon.Id);
					if (used >= coupon.TotalUsageLimit.Value)
						return BadRequest("Coupon usage limit reached.");
				}

				if (coupon.PerUserLimit != null)
				{
					var usedByUser = await (
						from oc in _db.OrderCoupons
						join o in _db.Orders on oc.OrderId equals o.Id
						where oc.CouponId == coupon.Id && o.UserId == userId
						select oc.Id
					).CountAsync();

					if (usedByUser >= coupon.PerUserLimit.Value)
						return BadRequest("You have reached coupon usage limit.");
				}

				var type = (coupon.Type ?? "").Trim().ToLowerInvariant();

				if (type == "percentage")
				{
					discountAmount = subtotal * (coupon.Value / 100m);

					if (coupon.MaximumDiscount != null)
						discountAmount = Math.Min(discountAmount, coupon.MaximumDiscount.Value);
				}
				else if (type == "fixed")
				{
					discountAmount = coupon.Value;
					if (discountAmount > subtotal)
						discountAmount = subtotal;
				}
				else if (type == "free_shipping")
				{
					shippingDiscount = shippingFee;
				}
				else
				{
					return BadRequest("Invalid coupon type.");
				}

				var discountError = ValidateMoney(discountAmount, "DiscountAmount");
				if (discountError != null)
					return BadRequest(discountError);
			}

			var total = (subtotal - discountAmount) + (shippingFee - shippingDiscount);
			if (total < 0) total = 0;

			var totalError = ValidateMoney(total, "TotalAmount");
			if (totalError != null)
				return BadRequest(totalError);

			var orderCode = $"ORD{DateTime.Now:yyyyMMddHHmmss}-{userId}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

			var order = new Order
			{
				OrderCode = orderCode,
				UserId = userId,
				Status = "pending",
				Currency = "VND",
				Subtotal = subtotal,
				DiscountAmount = discountAmount,
				ShippingFee = shippingFee,
				TotalAmount = total,
				FulfillmentType = req.FulfillmentType,
				ShippingAddressId = req.ShippingAddressId,
				CreatedAt = DateTime.Now,
				UpdatedAt = DateTime.Now
			};

			_db.Orders.Add(order);
			await _db.SaveChangesAsync();

			foreach (var x in cartItems)
			{
				var lineTotal = x.UnitPrice * x.ci.Quantity;

				var lineTotalError = ValidateMoney(lineTotal, "LineTotal");
				if (lineTotalError != null)
				{
					await tx.RollbackAsync();
					return BadRequest(lineTotalError);
				}

				_db.OrderItems.Add(new OrderItem
				{
					OrderId = order.Id,
					VariantId = x.v.Id,
					ProductNameSnapshot = x.p.Slug,
					VariantNameSnapshot = x.v.VariantName,
					UnitPrice = x.UnitPrice,
					Quantity = x.ci.Quantity,
					LineTotal = lineTotal,
					CreatedAt = DateTime.Now
				});
			}

			if (coupon != null)
			{
				_db.OrderCoupons.Add(new OrderCoupon
				{
					OrderId = order.Id,
					CouponId = coupon.Id,
					DiscountAmount = discountAmount,
					CreatedAt = DateTime.Now
				});
			}

			_db.CartItems.RemoveRange(cartItems.Select(x => x.ci));
			await _db.SaveChangesAsync();

			await tx.CommitAsync();

			return Ok(new OrderDto
			{
				Id = order.Id,
				OrderCode = order.OrderCode,
				Status = order.Status,
				Subtotal = order.Subtotal,
				ShippingFee = order.ShippingFee,
				TotalAmount = order.TotalAmount,
				Items = cartItems.Select(x => new OrderItemDto
				{
					ProductName = x.p.Slug,
					VariantName = x.v.VariantName,
					UnitPrice = x.UnitPrice,
					Quantity = x.ci.Quantity,
					LineTotal = x.UnitPrice * x.ci.Quantity
				}).ToList()
			});
		}
		catch
		{
			await tx.RollbackAsync();
			throw;
		}
	}

	[HttpGet("my")]
	public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
	{
		var userId = CurrentUserId();

		var orders = await _db.Orders.AsNoTracking()
			.Where(o => o.UserId == userId)
			.OrderByDescending(o => o.CreatedAt)
			.Take(50)
			.ToListAsync();

		return Ok(orders.Select(o => new OrderDto
		{
			Id = o.Id,
			OrderCode = o.OrderCode,
			Status = o.Status,
			Subtotal = o.Subtotal,
			ShippingFee = o.ShippingFee,
			TotalAmount = o.TotalAmount,
			Items = new()
		}).ToList());
	}

	[HttpGet("by-code/{orderCode}")]
	public async Task<ActionResult<OrderDto>> GetOrderByCode(string orderCode)
	{
		var userId = CurrentUserId();

		var order = await _db.Orders.AsNoTracking()
			.FirstOrDefaultAsync(o => o.OrderCode == orderCode && o.UserId == userId);

		if (order == null)
			return NotFound();

		var items = await _db.OrderItems.AsNoTracking()
			.Where(i => i.OrderId == order.Id)
			.Select(i => new OrderItemDto
			{
				ProductName = i.ProductNameSnapshot,
				VariantName = i.VariantNameSnapshot,
				UnitPrice = i.UnitPrice,
				Quantity = i.Quantity,
				LineTotal = i.LineTotal
			})
			.ToListAsync();

		return Ok(new OrderDto
		{
			Id = order.Id,
			OrderCode = order.OrderCode,
			Status = order.Status,
			Subtotal = order.Subtotal,
			ShippingFee = order.ShippingFee,
			TotalAmount = order.TotalAmount,
			Items = items
		});
	}
}