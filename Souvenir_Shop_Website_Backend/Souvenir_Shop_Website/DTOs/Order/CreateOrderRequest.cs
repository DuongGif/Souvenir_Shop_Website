namespace SouvenirShop.DTOs.Order;

public class CreateOrderRequest
{
	public long ShippingAddressId { get; set; }
	public string FulfillmentType { get; set; } = "delivery";
	public string? CouponCode { get; set; }
}