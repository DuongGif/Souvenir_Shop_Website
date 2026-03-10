using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.Services;

namespace Souvenir_Shop_Website.Controllers.API.Debug;

#if DEBUG
[ApiController]
[Route("api/debug")]
public class DebugTokenController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly JwtTokenService _jwt;

	public DebugTokenController(SouvenirShopContext db, JwtTokenService jwt)
	{
		_db = db;
		_jwt = jwt;
	}

	// GET /api/debug/token?email=user_test@gmail.com
	[HttpGet("token")]
	public async Task<IActionResult> GetToken([FromQuery] string email)
	{
		email = (email ?? "").Trim().ToLowerInvariant();
		if (string.IsNullOrWhiteSpace(email)) return BadRequest("email is required");

		var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == email);
		if (user == null) return NotFound("User not found");
		if (user.Status != "active") return BadRequest("User not active");

		var role = user.Role ?? "customer";
		var (token, expUtc) = _jwt.CreateToken(user.Id, user.Email, role);

		return Ok(new
		{
			userId = user.Id,
			email = user.Email,
			role,
			token,
			expiredAt = expUtc.ToLocalTime()
		});
	}
}
#endif