namespace SouvenirShop.DTOs.Review;

public class ReviewDto
{
	public long Id { get; set; }
	public long ProductId { get; set; }
	public int Rating { get; set; }
	public string? Title { get; set; }
	public string? Content { get; set; }
	public string Status { get; set; } = "";

	public DateTime? CreatedAt { get; set; }

	// Reply (nếu có)
	public string? ReplyContent { get; set; }
	public DateTime? ReplyCreatedAt { get; set; }
}