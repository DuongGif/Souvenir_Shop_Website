namespace Souvenir_Shop_Website.DTOs.Contact
{
	public class ContactRequest
	{
		public string FullName { get; set; } = "";
		public string Email { get; set; } = "";
		public string? Phone { get; set; }
		public string? Subject { get; set; }
		public string Message { get; set; } = "";
	}
}
