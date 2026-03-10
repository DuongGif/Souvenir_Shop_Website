using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Payment;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;
using System.Text.Json;
using Souvenir_Shop_Website.DTOs.Payment;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public PaymentsController(SouvenirShopContext db) => _db = db;

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// POST /api/payments
	[HttpPost]
	public async Task<ActionResult<PaymentDto>> CreatePayment([FromBody] CreatePaymentRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.OrderCode))
			return BadRequest("OrderCode is required.");
		if (string.IsNullOrWhiteSpace(req.PaymentMethod))
			return BadRequest("PaymentMethod is required.");

		var userId = CurrentUserId();
		var method = req.PaymentMethod.Trim().ToLowerInvariant();

		var allowed = new HashSet<string> { "cod", "bank_transfer", "momo", "vnpay" };
		if (!allowed.Contains(method))
			return BadRequest("PaymentMethod must be one of: cod, bank_transfer, momo, vnpay.");

		// ✅ order thuộc user
		var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderCode == req.OrderCode && o.UserId == userId);
		if (order == null) return NotFound("Order not found.");

		if (order.Status == "canceled" || order.Status == "completed")
			return BadRequest("Cannot create payment for canceled/completed order.");

		// ✅ lấy payment mới nhất nếu đã có pending/paid
		var existing = await _db.Payments
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync(p => p.OrderId == order.Id && (p.Status == "pending" || p.Status == "paid"));

		if (existing != null)
		{
			return Ok(ToDto(existing));
		}

		var payment = new Payment
		{
			OrderId = order.Id,
			PaymentMethod = method,
			Amount = order.TotalAmount,
			Status = "pending",
			CreatedAt = DateTime.Now
		};

		if (method == "cod")
		{
			payment.GatewayResponse = JsonSerializer.Serialize(new { type = "cod", note = "Pay on delivery" });
		}
		else if (method == "bank_transfer")
		{
			payment.GatewayResponse = JsonSerializer.Serialize(new
			{
				type = "bank_transfer",
				bank = "VCB",
				accountName = "SOUVENIR SHOP",
				accountNumber = "0123456789",
				content = $"PAY {order.OrderCode}",
				note = "Transfer with content above"
			});
		}
		else // momo/vnpay mock
		{
			var fakeTxn = Guid.NewGuid().ToString("N")[..12].ToUpper();
			payment.TransactionCode = $"{method.ToUpper()}_{fakeTxn}";
			payment.GatewayResponse = JsonSerializer.Serialize(new
			{
				type = method,
				transactionCode = payment.TransactionCode,
				paymentUrl = $"https://mock-gateway.local/pay?orderCode={order.OrderCode}&txn={payment.TransactionCode}",
				note = "Mock payment URL - use confirm endpoint to mark paid"
			});
		}

		_db.Payments.Add(payment);
		await _db.SaveChangesAsync();

		return Ok(ToDto(payment));
	}

	// POST /api/payments/confirm
	// Body: { "orderCode": "..." }
	[HttpPost("confirm")]
	public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.OrderCode))
			return BadRequest("OrderCode is required.");

		var userId = CurrentUserId();

		var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderCode == req.OrderCode && o.UserId == userId);
		if (order == null) return NotFound("Order not found.");

		// lấy payment mới nhất của order
		var payment = await _db.Payments
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync(p => p.OrderId == order.Id);

		if (payment == null) return NotFound("Payment not found.");

		if (payment.Status == "paid") return Ok(new { message = "Already paid." });

		payment.Status = "paid";
		payment.PaidAt = DateTime.Now;

		if (order.Status == "pending")
			order.Status = "confirmed";

		await _db.SaveChangesAsync();
		return Ok(new { message = "Payment confirmed.", paidAt = payment.PaidAt });
	}

	// GET /api/payments/by-order-code/{orderCode}
	[HttpGet("by-order-code/{orderCode}")]
	public async Task<ActionResult<PaymentDto>> GetLatestPaymentByOrderCode(string orderCode)
	{
		var userId = CurrentUserId();

		var order = await _db.Orders.AsNoTracking()
			.FirstOrDefaultAsync(o => o.OrderCode == orderCode && o.UserId == userId);

		if (order == null) return NotFound("Order not found.");

		var payment = await _db.Payments.AsNoTracking()
			.Where(p => p.OrderId == order.Id)
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync();

		if (payment == null) return NotFound("Payment not found.");

		return Ok(ToDto(payment));
	}

	private static PaymentDto ToDto(Payment p)
	{
		string? paymentUrl = null;
		string? txn = p.TransactionCode;

		// Try parse paymentUrl from gateway_response JSON (optional)
		if (!string.IsNullOrWhiteSpace(p.GatewayResponse))
		{
			try
			{
				using var doc = JsonDocument.Parse(p.GatewayResponse);
				if (doc.RootElement.TryGetProperty("paymentUrl", out var urlProp))
					paymentUrl = urlProp.GetString();
			}
			catch { /* ignore */ }
		}

		return new PaymentDto
		{
			PaymentMethod = p.PaymentMethod,
			Status = p.Status,
			Amount = p.Amount,
			PaymentUrl = paymentUrl,
			TransactionCode = txn
		};
	}
}