namespace SouvenirShop.DTOs.Chat;

public class ChatMessageDto
{
	public long Id { get; set; }
	public string SenderRole { get; set; } = "";
	public string SenderName { get; set; } = "";
	public string Content { get; set; } = "";
	public DateTime CreatedAt { get; set; }
}