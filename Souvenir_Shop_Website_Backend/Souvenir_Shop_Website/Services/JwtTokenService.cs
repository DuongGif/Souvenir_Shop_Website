using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Souvenir_Shop_Website.Services;

public class JwtTokenService
{
	private readonly IConfiguration _config;

	public JwtTokenService(IConfiguration config)
	{
		_config = config;
	}

	public (string token, DateTime expiresAtUtc) CreateToken(long userId, string email, string role)
	{
		var jwt = _config.GetSection("Jwt");
		var key = jwt["Key"];
		var issuer = jwt["Issuer"];
		var audience = jwt["Audience"];
		var expiryMinutesStr = jwt["ExpiryMinutes"];

		if (string.IsNullOrWhiteSpace(key))
			throw new InvalidOperationException("Jwt:Key is missing in appsettings.json");
		if (string.IsNullOrWhiteSpace(issuer))
			throw new InvalidOperationException("Jwt:Issuer is missing in appsettings.json");
		if (string.IsNullOrWhiteSpace(audience))
			throw new InvalidOperationException("Jwt:Audience is missing in appsettings.json");

		var expiryMinutes = 120;
		if (!string.IsNullOrWhiteSpace(expiryMinutesStr) && int.TryParse(expiryMinutesStr, out var m))
			expiryMinutes = m;

		email = (email ?? string.Empty).Trim().ToLowerInvariant();
		role = string.IsNullOrWhiteSpace(role) ? "customer" : role.Trim().ToLowerInvariant();

		var claims = new List<Claim>
		{
            // Standard JWT claims
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

            // ASP.NET claim types (dùng cho [Authorize], lấy userId từ token)
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
			new Claim(ClaimTypes.Email, email),
			new Claim(ClaimTypes.Role, role),
		};

		var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
		var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

		var expiresUtc = DateTime.UtcNow.AddMinutes(expiryMinutes);

		var token = new JwtSecurityToken(
			issuer: issuer,
			audience: audience,
			claims: claims,
			notBefore: DateTime.UtcNow,
			expires: expiresUtc,
			signingCredentials: creds
		);

		var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
		return (tokenString, expiresUtc);
	}
}