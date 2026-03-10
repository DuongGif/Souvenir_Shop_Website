using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Auth;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.Services;
using Microsoft.AspNetCore.Authorization;

namespace Souvenir_Shop_Website.Controllers.API;


[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly JwtTokenService _jwt;

	public AuthController(SouvenirShopContext db, JwtTokenService jwt)
	{
		_db = db;
		_jwt = jwt;
	}

	[HttpPost("register")]
	public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
			return BadRequest("Email and Password are required.");

		var email = req.Email.Trim().ToLowerInvariant();

		var exists = await _db.Users.AnyAsync(x => x.Email.ToLower() == email);
		if (exists) return BadRequest("Email already exists.");

		var user = new Souvenir_Shop_Website.Models.User
		{
			Email = email,
			Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
			FullName = req.FullName,
			PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
			Role = "customer",
			Status = "active",
			CreatedAt = DateTime.Now
		};

		_db.Users.Add(user);
		await _db.SaveChangesAsync();

		return Ok(new RegisterResponse
		{
			UserId = user.Id,
			Email = user.Email,
			FullName = user.FullName ?? "",
			Message = "Register successful"
		});
	}
	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
	{
		var email = (req.Email ?? "").Trim().ToLowerInvariant();
		var password = req.Password ?? "";

		var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email);
		if (user == null) return Unauthorized("Invalid email or password.");
		if (user.Status != "active") return Unauthorized("User is not active.");

		bool ok;
		try
		{
			ok = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
		}
		catch
		{
			return Unauthorized("Invalid email or password.");
		}
		if (!ok) return Unauthorized("Invalid email or password.");

		var role = user.Role ?? "customer";
		var (token, expiresAt) = _jwt.CreateToken(user.Id, user.Email, role);

		return Ok(new LoginResponse
		{
			UserId = user.Id,
			Email = user.Email,
			FullName = user.FullName ?? "",
			Role = role,
			Token = token,
			ExpiredAt = expiresAt.ToLocalTime()
		});
	}
}