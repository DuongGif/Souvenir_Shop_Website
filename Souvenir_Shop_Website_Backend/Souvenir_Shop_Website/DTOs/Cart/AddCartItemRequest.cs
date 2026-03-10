namespace SouvenirShop.DTOs.Cart;

public class AddCartItemRequest
{
	public long VariantId { get; set; }
	public int Quantity { get; set; } = 1;
}