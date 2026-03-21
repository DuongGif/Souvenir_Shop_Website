namespace SouvenirShop.DTOs.Cart;

public class CartItemDto
{
	public long Id { get; set; }
	public long VariantId { get; set; }

	public string ProductSlug { get; set; } = "";
	public string VariantName { get; set; } = "";

	public decimal Price { get; set; }
	public int Quantity { get; set; }
	public decimal LineTotal { get; set; }

	public string ? ImageUrl { get; set; }
}