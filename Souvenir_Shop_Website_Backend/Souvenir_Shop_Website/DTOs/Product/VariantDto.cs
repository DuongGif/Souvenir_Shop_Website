namespace SouvenirShop.DTOs.Product;

public class VariantDto
{
	public long Id { get; set; }
	public string Sku { get; set; } = "";
	public string VariantName { get; set; } = "";
	public decimal? Price { get; set; }
	public bool IsActive { get; set; }
}