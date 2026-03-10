namespace SouvenirShop.DTOs.Product;

public class ProductDetailDto
{
	public long Id { get; set; }
	public string Slug { get; set; } = "";
	public decimal? BasePrice { get; set; }
	public List<string> Images { get; set; } = new();
	public List<VariantDto> Variants { get; set; } = new();
}