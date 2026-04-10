namespace SouvenirShop.DTOs.Product;

public class ProductListDto
{
	public long Id { get; set; }
	public long CategoryId { get; set; }
	public string Slug { get; set; } = "";
	public decimal? Price { get; set; }
	public string? Status { get; set; }
	public bool IsFeatured { get; set; }
	public string? ImageUrl { get; set; }
}