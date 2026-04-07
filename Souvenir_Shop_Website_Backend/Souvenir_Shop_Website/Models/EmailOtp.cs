namespace Souvenir_Shop_Website.Models
{
	public class EmailOtp
	{
		public long Id { get; set; }
		public string Email { get; set; } = "";
		public string Purpose { get; set; } = ""; // register | reset_password
		public string CodeHash { get; set; } = "";
		public DateTime ExpiresAt { get; set; }
		public DateTime CreatedAt { get; set; }
		public DateTime? UsedAt { get; set; }
		public int AttemptCount { get; set; }
	}
}
