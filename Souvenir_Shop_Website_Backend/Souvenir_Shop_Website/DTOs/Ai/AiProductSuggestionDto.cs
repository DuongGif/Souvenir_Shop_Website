namespace Souvenir_Shop_Website.DTOs.Ai;

public class AiProductSuggestionDto
{
	public long Id { get; set; }
	public string Name { get; set; } = "";
	public string Slug { get; set; } = "";
	public decimal Price { get; set; }
	public string ImageUrl { get; set; } = "";
	public string CategoryName { get; set; } = "";
	public string Reason { get; set; } = "";
}