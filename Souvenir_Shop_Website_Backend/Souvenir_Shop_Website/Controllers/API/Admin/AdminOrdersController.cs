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

	// LẤY TẤT CẢ ĐƠN HÀNG
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var orders = await _db.Orders
			.OrderByDescending(o => o.CreatedAt)
			.ToListAsync();

		return Ok(orders);
	}

	// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
	[HttpPut("{id:long}/status")]
	public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateOrderStatusRequest req)
	{
		var order = await _db.Orders.FindAsync(id);
		if (order == null)
			return NotFound(new { message = "Không tìm thấy đơn hàng." });

		if (string.IsNullOrWhiteSpace(req.Status))
			return BadRequest("Trạng thái đơn hàng là bắt buộc.");

		order.Status = req.Status.Trim();
		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Cập nhật trạng thái đơn hàng thành công.",
			data = order
		});
	}
}