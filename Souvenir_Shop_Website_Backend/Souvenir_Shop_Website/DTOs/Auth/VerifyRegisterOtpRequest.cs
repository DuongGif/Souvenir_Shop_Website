namespace SouvenirShop.DTOs.Auth;

public class VerifyRegisterOtpRequest
{
	public string Email { get; set; } = "";
	public string Otp { get; set; } = "";
	public string FullName { get; set; } = "";
	public string Password { get; set; } = "";
	public string? Phone { get; set; }
}