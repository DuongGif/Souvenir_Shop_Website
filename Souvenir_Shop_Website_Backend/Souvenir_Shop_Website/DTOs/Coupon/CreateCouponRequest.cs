namespace SouvenirShop.DTOs.Coupon;

public class CreateCouponRequest
{
	public string Code { get; set; } = "";
	public string Type { get; set; } = ""; // percentage/fixed/free_shipping
	public decimal Value { get; set; }

	public decimal? MinimumOrderValue { get; set; }
	public decimal? MaximumDiscount { get; set; }

	public DateTime? StartAt { get; set; }
	public DateTime? EndAt { get; set; }

	public int? TotalUsageLimit { get; set; }
	public int? PerUserLimit { get; set; }

	public bool IsActive { get; set; } = true;
}