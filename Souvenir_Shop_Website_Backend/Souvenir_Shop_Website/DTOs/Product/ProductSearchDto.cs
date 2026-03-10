namespace SouvenirShop.DTOs.Product;

public class ProductSearchDto
{
	public long Id { get; set; }
	public string Slug { get; set; } = "";
	public decimal? Price { get; set; }
	public string? ImageUrl { get; set; }

	public decimal AvgRating { get; set; }
	public int ReviewCount { get; set; }
	public bool InStock { get; set; }
}