namespace SouvenirShop.DTOs.Product;

public class VariantCreateUpdateDto
{
	public string Sku { get; set; } = "";
	public string VariantName { get; set; } = "";
	public decimal? Price { get; set; }
	public int? WeightGrams { get; set; }
	public bool IsActive { get; set; } = true;
}