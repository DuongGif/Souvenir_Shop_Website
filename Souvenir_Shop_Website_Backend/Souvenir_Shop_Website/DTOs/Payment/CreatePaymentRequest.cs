namespace SouvenirShop.DTOs.Payment;

public class CreatePaymentRequest
{
	public string OrderCode { get; set; } = "";
	public string PaymentMethod { get; set; } = "";
}