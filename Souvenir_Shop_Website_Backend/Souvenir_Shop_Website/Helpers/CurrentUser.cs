using System.Security.Claims;

namespace Souvenir_Shop_Website.Helpers;

public static class CurrentUser
{
	public static long GetUserId(ClaimsPrincipal user)
	{
		var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
		if (string.IsNullOrWhiteSpace(id) || !long.TryParse(id, out var userId))
			throw new UnauthorizedAccessException("Invalid token: missing user id.");
		return userId;
	}

	public static string GetRole(ClaimsPrincipal user)
		=> user.FindFirstValue(ClaimTypes.Role) ?? "";
}