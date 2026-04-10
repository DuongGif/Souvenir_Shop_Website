using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;
using SouvenirShop.DTOs.User;
using SouvenirShop.DTOs.Address;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AccountController(SouvenirShopContext db) => _db = db;

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	// =======================
	// 1) THÔNG TIN CÁ NHÂN
	// =======================

	// GET /api/account/me
	[HttpGet("me")]
	public async Task<IActionResult> GetMe()
	{
		var userId = CurrentUserId();

		var user = await _db.Users.AsNoTracking()
			.Where(u => u.Id == userId)
			.Select(u => new
			{
				u.Id,
				u.Email,
				u.FullName,
				u.Phone,
				u.Role,
				u.Status,
				u.CreatedAt
			})
			.FirstOrDefaultAsync();

		if (user == null) return NotFound("Không tìm thấy người dùng.");
		return Ok(user);
	}

	// PUT /api/account/me
	[HttpPut("me")]
	public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
	{
		var userId = CurrentUserId();
		var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

		if (user == null)
			return NotFound("Không tìm thấy người dùng.");

		// kiểm tra dữ liệu đơn giản
		if (req.Phone != null && req.Phone.Length > 50)
			return BadRequest("Số điện thoại quá dài.");

		if (req.FullName != null && req.FullName.Length > 255)
			return BadRequest("Họ và tên quá dài.");

		// cập nhật
		if (req.FullName != null) user.FullName = req.FullName.Trim();
		if (req.Phone != null) user.Phone = req.Phone.Trim();

		user.UpdatedAt = DateTime.Now;

		await _db.SaveChangesAsync();
		return Ok(new { message = "Cập nhật thông tin cá nhân thành công." });
	}

	// =======================
	// 2) ĐỊA CHỈ
	// =======================

	// GET /api/account/addresses
	[HttpGet("addresses")]
	public async Task<ActionResult<List<AddressDto>>> GetAddresses()
	{
		var userId = CurrentUserId();

		var list = await _db.Addresses.AsNoTracking()
			.Where(a => a.UserId == userId)
			.OrderByDescending(a => a.IsDefault)
			.ThenByDescending(a => a.CreatedAt)
			.Select(a => new AddressDto
			{
				Id = a.Id,
				RecipientName = a.RecipientName,
				RecipientPhone = a.RecipientPhone,
				AddressLine1 = a.AddressLine1,
				AddressLine2 = a.AddressLine2,
				Ward = a.Ward,
				District = a.District,
				Province = a.Province,
				Country = a.Country,
				PostalCode = a.PostalCode,
				IsDefault = a.IsDefault
			})
			.ToListAsync();

		return Ok(list);
	}

	// POST /api/account/addresses
	[HttpPost("addresses")]
	public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressRequest req)
	{
		var userId = CurrentUserId();

		if (string.IsNullOrWhiteSpace(req.RecipientName))
			return BadRequest("Tên người nhận là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.RecipientPhone))
			return BadRequest("Số điện thoại người nhận là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.AddressLine1))
			return BadRequest("Địa chỉ là bắt buộc.");

		using var tx = await _db.Database.BeginTransactionAsync();

		// Nếu đặt mặc định thì bỏ mặc định cũ
		if (req.IsDefault)
		{
			var olds = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
			foreach (var x in olds) x.IsDefault = false;
		}

		// Nếu người dùng chưa có địa chỉ nào -> địa chỉ đầu tiên tự động là mặc định
		var hasAny = await _db.Addresses.AnyAsync(a => a.UserId == userId);
		var isDefault = req.IsDefault || !hasAny;

		var entity = new Address
		{
			UserId = userId,
			RecipientName = req.RecipientName.Trim(),
			RecipientPhone = req.RecipientPhone.Trim(),
			AddressLine1 = req.AddressLine1.Trim(),
			AddressLine2 = req.AddressLine2?.Trim(),
			Ward = req.Ward?.Trim(),
			District = req.District?.Trim(),
			Province = req.Province?.Trim(),
			Country = string.IsNullOrWhiteSpace(req.Country) ? "VN" : req.Country.Trim(),
			PostalCode = req.PostalCode?.Trim(),
			IsDefault = isDefault,
			CreatedAt = DateTime.Now
		};

		_db.Addresses.Add(entity);
		await _db.SaveChangesAsync();
		await tx.CommitAsync();

		return Ok(new AddressDto
		{
			Id = entity.Id,
			RecipientName = entity.RecipientName,
			RecipientPhone = entity.RecipientPhone,
			AddressLine1 = entity.AddressLine1,
			AddressLine2 = entity.AddressLine2,
			Ward = entity.Ward,
			District = entity.District,
			Province = entity.Province,
			Country = entity.Country,
			PostalCode = entity.PostalCode,
			IsDefault = entity.IsDefault
		});
	}

	// PUT /api/account/addresses/{id}
	[HttpPut("addresses/{id:long}")]
	public async Task<IActionResult> UpdateAddress(long id, [FromBody] UpdateAddressRequest req)
	{
		var userId = CurrentUserId();

		var address = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
		if (address == null)
			return NotFound("Không tìm thấy địa chỉ.");

		if (string.IsNullOrWhiteSpace(req.RecipientName))
			return BadRequest("Tên người nhận là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.RecipientPhone))
			return BadRequest("Số điện thoại người nhận là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.AddressLine1))
			return BadRequest("Địa chỉ là bắt buộc.");

		using var tx = await _db.Database.BeginTransactionAsync();

		if (req.IsDefault)
		{
			var olds = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault && a.Id != id).ToListAsync();
			foreach (var x in olds) x.IsDefault = false;
		}

		address.RecipientName = req.RecipientName.Trim();
		address.RecipientPhone = req.RecipientPhone.Trim();
		address.AddressLine1 = req.AddressLine1.Trim();
		address.AddressLine2 = req.AddressLine2?.Trim();
		address.Ward = req.Ward?.Trim();
		address.District = req.District?.Trim();
		address.Province = req.Province?.Trim();
		address.Country = string.IsNullOrWhiteSpace(req.Country) ? "VN" : req.Country.Trim();
		address.PostalCode = req.PostalCode?.Trim();
		address.IsDefault = req.IsDefault;

		await _db.SaveChangesAsync();
		await tx.CommitAsync();

		return Ok(new { message = "Cập nhật địa chỉ thành công." });
	}

	// PUT /api/account/addresses/{id}/default
	[HttpPut("addresses/{id:long}/default")]
	public async Task<IActionResult> SetDefaultAddress(long id)
	{
		var userId = CurrentUserId();

		var address = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
		if (address == null)
			return NotFound("Không tìm thấy địa chỉ.");

		using var tx = await _db.Database.BeginTransactionAsync();

		var olds = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault && a.Id != id).ToListAsync();
		foreach (var x in olds) x.IsDefault = false;

		address.IsDefault = true;

		await _db.SaveChangesAsync();
		await tx.CommitAsync();

		return Ok(new { message = "Đặt địa chỉ mặc định thành công." });
	}

	// DELETE /api/account/addresses/{id}
	[HttpDelete("addresses/{id:long}")]
	public async Task<IActionResult> DeleteAddress(long id)
	{
		var userId = CurrentUserId();

		var address = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
		if (address == null)
			return NotFound("Không tìm thấy địa chỉ.");

		var wasDefault = address.IsDefault;

		_db.Addresses.Remove(address);
		await _db.SaveChangesAsync();

		// Nếu xóa địa chỉ mặc định -> đặt địa chỉ mới nhất còn lại thành mặc định
		if (wasDefault)
		{
			var latest = await _db.Addresses
				.Where(a => a.UserId == userId)
				.OrderByDescending(a => a.CreatedAt)
				.FirstOrDefaultAsync();

			if (latest != null)
			{
				latest.IsDefault = true;
				await _db.SaveChangesAsync();
			}
		}

		return Ok(new { message = "Xóa địa chỉ thành công." });
	}
}