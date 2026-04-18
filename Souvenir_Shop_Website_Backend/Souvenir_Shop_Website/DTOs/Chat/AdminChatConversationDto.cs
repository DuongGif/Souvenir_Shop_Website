namespace SouvenirShop.DTOs.Chat;

public class AdminChatConversationDto
{
	public long ConversationId { get; set; }
	public long CustomerId { get; set; }
	public string CustomerName { get; set; } = "";
	public string CustomerEmail { get; set; } = "";
	public string LastMessage { get; set; } = "";
	public DateTime? LastMessageAt { get; set; }
	public int UnreadCount { get; set; }
}