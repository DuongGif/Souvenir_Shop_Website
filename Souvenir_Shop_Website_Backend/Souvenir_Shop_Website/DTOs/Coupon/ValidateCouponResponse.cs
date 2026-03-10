namespace SouvenirShop.DTOs.Coupon;

public class ValidateCouponResponse
{
	public bool IsValid { get; set; }
	public string Message { get; set; } = "";
	public decimal DiscountAmount { get; set; }
	public decimal ShippingDiscount { get; set; } // nếu free_shipping
}