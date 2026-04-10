using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Auth;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.Services;
using AppUser = Souvenir_Shop_Website.Models.User;

namespace Souvenir_Shop_Website.Controllers.API;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	private readonly JwtTokenService _jwt;
	private readonly EmailService _emailService;
	private readonly OtpService _otpService;

	public AuthController(
		SouvenirShopContext db,
		JwtTokenService jwt,
		EmailService emailService,
		OtpService otpService)
	{
		_db = db;
		_jwt = jwt;
		_emailService = emailService;
		_otpService = otpService;
	}

	// =======================
	// ĐĂNG KÝ
	// =======================

	[HttpPost("register")]
	public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
			return BadRequest("Email và mật khẩu là bắt buộc.");

		var email = OtpService.NormalizeEmail(req.Email);

		var exists = await _db.Users.AnyAsync(x => x.Email.ToLower() == email);
		if (exists) return BadRequest("Email đã tồn tại.");

		var user = new AppUser
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
			Message = "Đăng ký thành công."
		});
	}

	// =======================
	// ĐĂNG NHẬP
	// =======================

	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
	{
		var email = OtpService.NormalizeEmail(req.Email ?? "");
		var password = req.Password ?? "";

		var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email);
		if (user == null) return Unauthorized("Sai email hoặc mật khẩu.");
		if (user.Status != "active") return Unauthorized("Tài khoản đang bị khóa.");

		bool ok;
		try
		{
			ok = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
		}
		catch
		{
			return Unauthorized("Sai email hoặc mật khẩu.");
		}

		if (!ok) return Unauthorized("Sai email hoặc mật khẩu.");

		return Ok(BuildLoginResponse(user));
	}

	// =======================
	// OTP ĐĂNG KÝ
	// =======================

	[HttpPost("register/send-otp")]
	public async Task<IActionResult> SendRegisterOtp([FromBody] SendOtpRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email))
			return BadRequest("Email là bắt buộc.");

		var email = OtpService.NormalizeEmail(req.Email);

		var exists = await _db.Users.AnyAsync(x => x.Email.ToLower() == email);
		if (exists)
			return BadRequest("Email đã tồn tại.");

		var result = await _otpService.SendOtpAsync(
			email,
			"register",
			"Mã OTP đăng ký tài khoản SouVN",
			"Bạn đang yêu cầu đăng ký tài khoản SouVN.");

		if (!result.Ok)
			return BadRequest(result.Message);

		return Ok(new { message = result.Message });
	}

	[HttpPost("register/verify-otp")]
	public async Task<ActionResult<RegisterResponse>> VerifyRegisterOtp([FromBody] VerifyRegisterOtpRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email))
			return BadRequest("Vui lòng nhập email.");

		if (string.IsNullOrWhiteSpace(req.Otp))
			return BadRequest("Vui lòng nhập mã OTP.");

		if (string.IsNullOrWhiteSpace(req.Password))
			return BadRequest("Vui lòng nhập mật khẩu.");

		var email = OtpService.NormalizeEmail(req.Email);

		var exists = await _db.Users.AnyAsync(x => x.Email.ToLower() == email);
		if (exists)
			return BadRequest("Email đã tồn tại.");

		var verify = await _otpService.VerifyOtpAsync(email, "register", req.Otp);
		if (!verify.Ok || verify.Entity == null)
			return BadRequest(verify.Message);

		var user = new AppUser
		{
			Email = email,
			Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
			FullName = string.IsNullOrWhiteSpace(req.FullName) ? email : req.FullName.Trim(),
			PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
			Role = "customer",
			Status = "active",
			CreatedAt = DateTime.Now
		};

		verify.Entity.UsedAt = DateTime.Now;

		_db.Users.Add(user);
		await _db.SaveChangesAsync();

		return Ok(new RegisterResponse
		{
			UserId = user.Id,
			Email = user.Email,
			FullName = user.FullName ?? "",
			Message = "Đăng ký tài khoản thành công bằng OTP."
		});
	}

	// =======================
	// QUÊN MẬT KHẨU
	// =======================

	[HttpPost("forgot-password/send-otp")]
	public async Task<IActionResult> SendForgotPasswordOtp([FromBody] SendOtpRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email))
			return BadRequest("Email là bắt buộc.");

		var email = OtpService.NormalizeEmail(req.Email);

		var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email);

		if (user == null)
		{
			return Ok(new
			{
				message = "Nếu email tồn tại trong hệ thống, OTP đã được gửi."
			});
		}

		await _otpService.SendOtpAsync(
			email,
			"reset_password",
			"Mã OTP đặt lại mật khẩu SouVN",
			"Bạn đang yêu cầu đặt lại mật khẩu SouVN.");

		return Ok(new
		{
			message = "Nếu email tồn tại trong hệ thống, OTP đã được gửi."
		});
	}

	[HttpPost("forgot-password/reset")]
	public async Task<IActionResult> ResetPasswordWithOtp([FromBody] ResetPasswordWithOtpRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Email))
			return BadRequest("Email là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.Otp))
			return BadRequest("OTP là bắt buộc.");

		if (string.IsNullOrWhiteSpace(req.NewPassword))
			return BadRequest("Mật khẩu mới là bắt buộc.");

		var email = OtpService.NormalizeEmail(req.Email);

		var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email);
		if (user == null)
			return BadRequest("Yêu cầu không hợp lệ.");

		var verify = await _otpService.VerifyOtpAsync(email, "reset_password", req.Otp);
		if (!verify.Ok || verify.Entity == null)
			return BadRequest(verify.Message);

		user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
		verify.Entity.UsedAt = DateTime.Now;

		await _db.SaveChangesAsync();

		return Ok(new
		{
			message = "Đổi mật khẩu thành công."
		});
	}

	// =======================
	// BUILD TOKEN
	// =======================

	private LoginResponse BuildLoginResponse(AppUser user)
	{
		if (user.Status != "active")
			throw new InvalidOperationException("Người dùng không hoạt động.");

		var role = user.Role ?? "customer";
		var (token, expiresAt) = _jwt.CreateToken(user.Id, user.Email, role);

		return new LoginResponse
		{
			UserId = user.Id,
			Email = user.Email,
			FullName = user.FullName ?? "",
			Role = role,
			Token = token,
			ExpiredAt = expiresAt.ToLocalTime()
		};
	}
}