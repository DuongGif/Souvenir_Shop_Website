namespace SouvenirShop.DTOs.Address;

public class AddressDto
{
	public long Id { get; set; }
	public string RecipientName { get; set; } = "";
	public string RecipientPhone { get; set; } = "";
	public string AddressLine1 { get; set; } = "";
	public string? AddressLine2 { get; set; }
	public string? Ward { get; set; }
	public string? District { get; set; }
	public string? Province { get; set; }
	public string Country { get; set; } = "VN";
	public string? PostalCode { get; set; }
	public bool IsDefault { get; set; }
}