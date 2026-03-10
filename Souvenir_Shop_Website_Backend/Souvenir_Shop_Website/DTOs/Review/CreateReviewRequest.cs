namespace SouvenirShop.DTOs.Review;

public class CreateReviewRequest
{
	public long ProductId { get; set; }
	public int Rating { get; set; } // 1..5
	public string? Title { get; set; }
	public string? Content { get; set; }
}