namespace Souvenir_Shop_Website.DTOs.Ai;

public class AiChatRecommendResponse
{
	public string Reply { get; set; } = "";
	public List<AiProductSuggestionDto> Products { get; set; } = new();
}