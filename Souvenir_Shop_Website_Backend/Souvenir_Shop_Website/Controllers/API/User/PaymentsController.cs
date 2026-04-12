using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SouvenirShop.DTOs.Payment;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.Services;
using System.Security.Claims;
using System.Text.Json;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly IBankTransferService _bankTransferService;
	private readonly BankTransferOptions _bankOptions;

	public PaymentsController(
		SouvenirShopContext db,
		IBankTransferService bankTransferService,
		IOptions<BankTransferOptions> bankOptions)
	{
		_db = db;
		_bankTransferService = bankTransferService;
		_bankOptions = bankOptions.Value;
	}

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// TẠO THANH TOÁN
	[HttpPost]
	public async Task<ActionResult<PaymentDto>> CreatePayment([FromBody] CreatePaymentRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.OrderCode))
			return BadRequest("Mã đơn hàng là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.PaymentMethod))
			return BadRequest("Phương thức thanh toán là bắt buộc.");

		var userId = CurrentUserId();
		var method = req.PaymentMethod.Trim().ToLowerInvariant();

		var allowed = new HashSet<string> { "cod", "bank_transfer" };
		if (!allowed.Contains(method))
			return BadRequest("Phương thức thanh toán chỉ hỗ trợ: cod, bank_transfer.");

		var order = await _db.Orders
			.FirstOrDefaultAsync(o => o.OrderCode == req.OrderCode && o.UserId == userId);

		if (order == null)
			return NotFound("Không tìm thấy đơn hàng.");

		if (order.Status == "canceled" || order.Status == "completed")
			return BadRequest("Không thể tạo thanh toán cho đơn hàng đã hủy hoặc đã hoàn thành.");

		// Nếu đã thanh toán rồi thì trả về payment đã thanh toán
		var existingPaid = await _db.Payments
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == "paid");

		if (existingPaid != null)
			return Ok(ToDto(existingPaid));

		// Nếu đã có payment pending cùng phương thức thì trả lại luôn
		var existingPendingSameMethod = await _db.Payments
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == "pending" && p.PaymentMethod == method);

		if (existingPendingSameMethod != null)
			return Ok(ToDto(existingPendingSameMethod));

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
			payment.GatewayResponse = JsonSerializer.Serialize(new
			{
				type = "cod",
				note = "Thanh toán khi nhận hàng"
			});
		}
		else if (method == "bank_transfer")
		{
			var transferContent = $"PAY{order.OrderCode}";
			if (transferContent.Length > 50)
				transferContent = $"DH{order.Id}";

			var qrUrl = _bankTransferService.BuildQrUrl(
				_bankOptions.BankId,
				_bankOptions.AccountNo,
				_bankOptions.AccountName,
				order.TotalAmount,
				transferContent
			);

			payment.TransactionCode = transferContent;
			payment.GatewayResponse = JsonSerializer.Serialize(new
			{
				type = "bank_transfer",
				bankId = _bankOptions.BankId,
				bankName = _bankOptions.BankName,
				accountName = _bankOptions.AccountName,
				accountNumber = _bankOptions.AccountNo,
				transferContent = transferContent,
				paymentUrl = qrUrl,
				note = "Chuyển khoản đúng nội dung để hệ thống xác nhận"
			});
		}

		_db.Payments.Add(payment);
		await _db.SaveChangesAsync();

		return Ok(ToDto(payment));
	}

	// XÁC NHẬN THANH TOÁN
	// Chỉ dùng cho chuyển khoản ngân hàng trong môi trường demo/test
	[HttpPost("confirm")]
	public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.OrderCode))
			return BadRequest("Mã đơn hàng là bắt buộc.");

		var userId = CurrentUserId();

		var order = await _db.Orders
			.FirstOrDefaultAsync(o => o.OrderCode == req.OrderCode && o.UserId == userId);

		if (order == null)
			return NotFound("Không tìm thấy đơn hàng.");

		var payment = await _db.Payments
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync(p => p.OrderId == order.Id);

		if (payment == null)
			return NotFound("Không tìm thấy thanh toán.");

		// COD không được xác nhận thanh toán trước
		if (payment.PaymentMethod == "cod")
			return BadRequest("Đơn hàng COD không cần xác nhận thanh toán trước.");

		if (payment.PaymentMethod != "bank_transfer")
			return BadRequest("Chỉ hỗ trợ xác nhận thanh toán cho chuyển khoản ngân hàng.");

		if (payment.Status == "paid")
			return Ok(new { message = "Đơn hàng đã được thanh toán trước đó." });

		payment.Status = "paid";
		payment.PaidAt = DateTime.Now;

		if (order.Status == "pending")
			order.Status = "confirmed";

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Xác nhận thanh toán thành công.",
			paidAt = payment.PaidAt
		});
	}

	// LẤY THANH TOÁN THEO MÃ ĐƠN
	[HttpGet("by-order-code/{orderCode}")]
	public async Task<ActionResult<PaymentDto>> GetLatestPaymentByOrderCode(string orderCode)
	{
		var userId = CurrentUserId();

		var order = await _db.Orders.AsNoTracking()
			.FirstOrDefaultAsync(o => o.OrderCode == orderCode && o.UserId == userId);

		if (order == null)
			return NotFound("Không tìm thấy đơn hàng.");

		var payment = await _db.Payments.AsNoTracking()
			.Where(p => p.OrderId == order.Id)
			.OrderByDescending(p => p.Id)
			.FirstOrDefaultAsync();

		if (payment == null)
			return NotFound("Không tìm thấy thanh toán.");

		return Ok(ToDto(payment));
	}

	private static PaymentDto ToDto(Payment p)
	{
		string? paymentUrl = null;
		string? txn = p.TransactionCode;
		string? bankId = null;
		string? bankName = null;
		string? accountName = null;
		string? accountNumber = null;

		if (!string.IsNullOrWhiteSpace(p.GatewayResponse))
		{
			try
			{
				using var doc = JsonDocument.Parse(p.GatewayResponse);
				var root = doc.RootElement;

				if (root.TryGetProperty("paymentUrl", out var urlProp))
					paymentUrl = urlProp.GetString();

				if (root.TryGetProperty("bankId", out var bankIdProp))
					bankId = bankIdProp.GetString();

				if (root.TryGetProperty("bankName", out var bankNameProp))
					bankName = bankNameProp.GetString();

				if (root.TryGetProperty("accountName", out var accountNameProp))
					accountName = accountNameProp.GetString();

				if (root.TryGetProperty("accountNumber", out var accountNumberProp))
					accountNumber = accountNumberProp.GetString();

				if (root.TryGetProperty("transferContent", out var transferContentProp))
					txn = transferContentProp.GetString();
			}
			catch
			{
				// Bỏ qua lỗi parse JSON
			}
		}

		return new PaymentDto
		{
			PaymentMethod = p.PaymentMethod,
			Status = p.Status,
			Amount = p.Amount,
			PaymentUrl = paymentUrl,
			TransactionCode = txn,
			BankId = bankId,
			BankName = bankName,
			AccountName = accountName,
			AccountNo = accountNumber
		};
	}
}