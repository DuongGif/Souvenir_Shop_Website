namespace SouvenirShop.DTOs.Order;

public class OrderDto
{
	public long Id { get; set; }
	public string OrderCode { get; set; } = "";
	public string Status { get; set; } = "";
	public decimal Subtotal { get; set; }
	public decimal ShippingFee { get; set; }
	public decimal TotalAmount { get; set; }
	public List<OrderItemDto> Items { get; set; } = new();
}