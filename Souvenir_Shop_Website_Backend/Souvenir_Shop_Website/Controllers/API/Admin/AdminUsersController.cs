using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public AdminUsersController(SouvenirShopContext db) => _db = db;

	// GET all users (không trả password_hash)
	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var users = await _db.Users.AsNoTracking()
			.Select(u => new
			{
				u.Id,
				u.Email,
				u.Phone,
				u.FullName,
				u.Role,
				u.Status,
				u.CreatedAt,
				u.UpdatedAt
			})
			.ToListAsync();

		return Ok(users);
	}

	// PUT lock user
	[HttpPut("{id:long}/lock")]
	public async Task<IActionResult> LockUser(long id)
	{
		var user = await _db.Users.FindAsync(id);
		if (user == null) return NotFound();

		user.Status = "locked";
		user.UpdatedAt = DateTime.Now;
		await _db.SaveChangesAsync();

		return Ok(new
		{
			user.Id,
			user.Email,
			user.Status
		});
	}

	// PUT unlock user
	[HttpPut("{id:long}/unlock")]
	public async Task<IActionResult> UnlockUser(long id)
	{
		var user = await _db.Users.FindAsync(id);
		if (user == null) return NotFound();

		user.Status = "active";
		user.UpdatedAt = DateTime.Now;
		await _db.SaveChangesAsync();

		return Ok(new
		{
			user.Id,
			user.Email,
			user.Status
		});
	}
}