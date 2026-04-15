using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.DTOs.Order;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AdminOrdersController(SouvenirShopContext db) => _db = db;

	private static string NormalizeStatus(string? status)
		=> (status ?? "").Trim().ToLowerInvariant();

	// LẤY TẤT CẢ ĐƠN HÀNG
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var orders = await _db.Orders
			.OrderByDescending(o => o.CreatedAt)
			.ToListAsync();

		return Ok(orders);
	}

	// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG THỦ CÔNG
	[HttpPut("{id:long}/status")]
	public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateOrderStatusRequest req)
	{
		var order = await _db.Orders.FindAsync(id);
		if (order == null)
			return NotFound(new { message = "Không tìm thấy đơn hàng." });

		if (string.IsNullOrWhiteSpace(req.Status))
			return BadRequest("Trạng thái đơn hàng là bắt buộc.");

		var status = NormalizeStatus(req.Status);

		status = status switch
		{
			"pending" => "pending",
			"confirmed" => "confirmed",
			"paid" => "paid",
			"shipping" => "shipping",
			"completed" => "completed",
			"cancelled" => "cancelled",
			"canceled" => "cancelled",

			"cancel_requested" => "cancel_requested",
			"pending_cancel" => "cancel_requested",
			"cho_duyet_huy" => "cancel_requested",

			"return_requested" => "return_requested",
			"yeu_cau_hoan_hang" => "return_requested",

			"returned" => "returned",
			"da_hoan_hang" => "returned",

			"đang giao" => "shipping",
			"dang_giao" => "shipping",
			"da_thanh_toan" => "paid",
			"hoan_thanh" => "completed",
			"da_huy" => "cancelled",

			_ => ""
		};

		if (string.IsNullOrWhiteSpace(status))
			return BadRequest("Trạng thái đơn hàng không hợp lệ.");

		order.Status = status;
		order.UpdatedAt = DateTime.Now;
		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Cập nhật trạng thái đơn hàng thành công.",
			data = order
		});
	}

	// DUYỆT HỦY ĐƠN
	// Chỉ áp dụng khi user đã gửi yêu cầu hủy
	[HttpPut("{id:long}/approve-cancel")]
	public async Task<IActionResult> ApproveCancel(long id)
	{
		var order = await _db.Orders.FindAsync(id);
		if (order == null)
			return NotFound(new { message = "Không tìm thấy đơn hàng." });

		var status = NormalizeStatus(order.Status);
		if (status != "cancel_requested")
			return BadRequest("Đơn hàng này không ở trạng thái chờ duyệt hủy.");

		order.Status = "cancelled";
		order.UpdatedAt = DateTime.Now;

		var payments = await _db.Payments
			.Where(p => p.OrderId == order.Id)
			.ToListAsync();

		foreach (var payment in payments)
		{
			var paymentStatus = NormalizeStatus(payment.Status);

			if (paymentStatus != "paid" &&
				paymentStatus != "refunded" &&
				paymentStatus != "cancelled" &&
				paymentStatus != "canceled")
			{
				payment.Status = "cancelled";
			}
		}

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Đã duyệt hủy đơn hàng.",
			data = order
		});
	}

	// DUYỆT HOÀN HÀNG
	// Chỉ áp dụng khi user đã gửi yêu cầu hoàn hàng
	[HttpPut("{id:long}/approve-return")]
	public async Task<IActionResult> ApproveReturn(long id)
	{
		var order = await _db.Orders.FindAsync(id);
		if (order == null)
			return NotFound(new { message = "Không tìm thấy đơn hàng." });

		var status = NormalizeStatus(order.Status);
		if (status != "return_requested")
			return BadRequest("Đơn hàng này không ở trạng thái chờ duyệt hoàn hàng.");

		order.Status = "returned";
		order.UpdatedAt = DateTime.Now;

		var payments = await _db.Payments
			.Where(p => p.OrderId == order.Id)
			.ToListAsync();

		foreach (var payment in payments)
		{
			var paymentStatus = NormalizeStatus(payment.Status);
			if (paymentStatus == "paid")
			{
				payment.Status = "refunded";
			}
		}

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Đã duyệt hoàn hàng.",
			data = order
		});
	}
}