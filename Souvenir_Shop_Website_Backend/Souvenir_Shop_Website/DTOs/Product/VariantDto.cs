namespace SouvenirShop.DTOs.Product;

public class VariantDto
{
	public long Id { get; set; }
	public long ProductId { get; set; }
	public string Sku { get; set; } = "";
	public string VariantName { get; set; } = "";
	public decimal? Price { get; set; }
	public int? WeightGrams { get; set; }
	public bool IsActive { get; set; }

	// tồn kho hiện tại của biến thể
	public int StockQuantity { get; set; }
}