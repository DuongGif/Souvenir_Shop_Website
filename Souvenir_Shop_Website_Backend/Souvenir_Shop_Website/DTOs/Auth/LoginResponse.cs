namespace SouvenirShop.DTOs.Auth;

public class LoginResponse
{
	public long UserId { get; set; }

	public string Email { get; set; } = "";

	public string FullName { get; set; } = "";

	public string Role { get; set; } = "";

	// JWT token
	public string Token { get; set; } = "";

	// Thời gian hết hạn token (optional nhưng nên có)
	public DateTime ExpiredAt { get; set; }
}