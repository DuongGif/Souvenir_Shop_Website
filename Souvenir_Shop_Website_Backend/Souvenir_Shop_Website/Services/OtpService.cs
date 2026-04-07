using Microsoft.EntityFrameworkCore;
using Souvenir_Shop_Website.Models;
using System.Security.Cryptography;
using System.Text;

namespace Souvenir_Shop_Website.Services;

public class OtpService
{
	private readonly SouvenirShopContext _db;
	private readonly EmailService _emailService;

	private const int OtpExpireMinutes = 5;
	private const int OtpResendSeconds = 60;
	private const int OtpMaxAttempts = 5;

	public OtpService(SouvenirShopContext db, EmailService emailService)
	{
		_db = db;
		_emailService = emailService;
	}

	public async Task<(bool Ok, string Message)> SendOtpAsync(
		string email,
		string purpose,
		string subject,
		string emailTitle)
	{
		var normalizedEmail = NormalizeEmail(email);

		var lastOtp = await _db.EmailOtps
			.Where(x => x.Email.ToLower() == normalizedEmail
						&& x.Purpose == purpose
						&& x.UsedAt == null)
			.OrderByDescending(x => x.CreatedAt)
			.FirstOrDefaultAsync();

		if (lastOtp != null && (DateTime.Now - lastOtp.CreatedAt).TotalSeconds < OtpResendSeconds)
			return (false, $"Vui lòng chờ {OtpResendSeconds} giây trước khi gửi lại OTP.");

		var code = GenerateOtpCode();

		var otp = new EmailOtp
		{
			Email = normalizedEmail,
			Purpose = purpose,
			CodeHash = HashText(code),
			ExpiresAt = DateTime.Now.AddMinutes(OtpExpireMinutes),
			CreatedAt = DateTime.Now,
			AttemptCount = 0
		};

		_db.EmailOtps.Add(otp);
		await _db.SaveChangesAsync();

		var html = $@"
			<p>Xin chào,</p>
			<p>{emailTitle}</p>
			<p>Mã OTP của bạn là: <strong style='font-size:20px'>{code}</strong></p>
			<p>Mã có hiệu lực trong {OtpExpireMinutes} phút.</p>
			<p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>";

		await _emailService.SendHtmlAsync(normalizedEmail, subject, html);

		return (true, "OTP đã được gửi về email của bạn.");
	}

	public async Task<(bool Ok, string Message, EmailOtp? Entity)> VerifyOtpAsync(
		string email,
		string purpose,
		string otpCode)
	{
		var normalizedEmail = NormalizeEmail(email);

		var otp = await _db.EmailOtps
			.Where(x => x.Email.ToLower() == normalizedEmail
						&& x.Purpose == purpose
						&& x.UsedAt == null)
			.OrderByDescending(x => x.CreatedAt)
			.FirstOrDefaultAsync();

		if (otp == null)
			return (false, "OTP không tồn tại hoặc đã hết hạn.", null);

		if (otp.AttemptCount >= OtpMaxAttempts)
			return (false, "OTP đã vượt quá số lần nhập cho phép.", null);

		if (otp.ExpiresAt < DateTime.Now)
			return (false, "OTP đã hết hạn.", null);

		var inputHash = HashText(otpCode.Trim());
		if (!string.Equals(inputHash, otp.CodeHash, StringComparison.OrdinalIgnoreCase))
		{
			otp.AttemptCount += 1;
			await _db.SaveChangesAsync();
			return (false, "OTP không đúng.", null);
		}

		return (true, "OTP hợp lệ.", otp);
	}

	public static string NormalizeEmail(string email)
		=> email.Trim().ToLowerInvariant();

	private static string GenerateOtpCode()
	{
		var number = RandomNumberGenerator.GetInt32(0, 1000000);
		return number.ToString("D6");
	}

	private static string HashText(string value)
	{
		using var sha = SHA256.Create();
		var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
		return Convert.ToHexString(bytes);
	}
}