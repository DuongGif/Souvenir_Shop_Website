namespace SouvenirShop.DTOs.Payment;

public class PaymentDto
{
	public string PaymentMethod { get; set; } = "";
	public string Status { get; set; } = "";
	public decimal Amount { get; set; }

	// Optional: để frontend hiển thị link thanh toán mock (momo/vnpay)
	public string? PaymentUrl { get; set; }

	// Optional: để debug / hiển thị mã giao dịch (mock)
	public string? TransactionCode { get; set; }
}