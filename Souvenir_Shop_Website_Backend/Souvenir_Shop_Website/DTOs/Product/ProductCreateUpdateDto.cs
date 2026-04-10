namespace SouvenirShop.DTOs.Product;

public class ProductCreateUpdateDto
{
	public long CategoryId { get; set; }
	public string Slug { get; set; } = "";
	public decimal? BasePrice { get; set; }
	public string Status { get; set; } = "";
	public bool IsFeatured { get; set; }

	public List<string> Images { get; set; } = new();

	// bắt buộc phải có ít nhất 1 biến thể ở backend
	public List<VariantCreateUpdateDto> Variants { get; set; } = new();
}