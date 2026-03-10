namespace SouvenirShop.DTOs.Auth;

public class RegisterResponse
{
	public long UserId { get; set; }

	public string Email { get; set; } = "";

	public string FullName { get; set; } = "";

	public string Message { get; set; } = "Register successful";
}