namespace SouvenirShop.DTOs.Coupon;

public class ValidateCouponRequest
{
	public string Code { get; set; } = "";
	public decimal Subtotal { get; set; } // tổng tiền hàng (chưa ship)
}