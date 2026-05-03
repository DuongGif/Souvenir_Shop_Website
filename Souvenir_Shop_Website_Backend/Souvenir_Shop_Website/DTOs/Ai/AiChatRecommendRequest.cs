namespace Souvenir_Shop_Website.DTOs.Ai;

public class AiChatRecommendRequest
{
	public string Message { get; set; } = "";
	public int MaxProducts { get; set; } = 5;
}