namespace Souvenir_Shop_Website.Models;

public partial class ChatConversation
{
	public long Id { get; set; }

	public long CustomerId { get; set; }

	public string Status { get; set; } = "open";

	public DateTime CreatedAt { get; set; }

	public DateTime UpdatedAt { get; set; }

	public DateTime? LastMessageAt { get; set; }

	public virtual User Customer { get; set; } = null!;

	public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}