namespace Souvenir_Shop_Website.Models;

public partial class ChatMessage
{
	public long Id { get; set; }

	public long ConversationId { get; set; }

	public long? SenderUserId { get; set; }

	public string SenderRole { get; set; } = "customer";

	public string Content { get; set; } = "";

	public bool IsReadByAdmin { get; set; }

	public bool IsReadByCustomer { get; set; }

	public DateTime CreatedAt { get; set; }

	public virtual ChatConversation Conversation { get; set; } = null!;

	public virtual User? SenderUser { get; set; }
}