namespace SouvenirShop.DTOs.Cart;

public class CartDto
{
	public long CartId { get; set; }
	public List<CartItemDto> Items { get; set; } = new();
	public decimal Subtotal { get; set; }

	public int TotalItems { get; set; }
}