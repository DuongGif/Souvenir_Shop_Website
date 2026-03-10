namespace SouvenirShop.DTOs.Order;

public class OrderItemDto
{
	public string ProductName { get; set; } = "";
	public string VariantName { get; set; } = "";
	public decimal UnitPrice { get; set; }
	public int Quantity { get; set; }
	public decimal LineTotal { get; set; }
}