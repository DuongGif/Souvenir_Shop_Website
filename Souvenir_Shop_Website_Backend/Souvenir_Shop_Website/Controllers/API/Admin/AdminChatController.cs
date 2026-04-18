using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Chat;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.Admin;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin/chat")]
public class AdminChatController : ControllerBase
{
	private readonly SouvenirShopContext _db;

	public AdminChatController(SouvenirShopContext db)
	{
		_db = db;
	}

	[HttpGet("conversations")]
	public async Task<ActionResult<List<AdminChatConversationDto>>> GetConversations([FromQuery] string? keyword)
	{
		var query = _db.ChatConversations
			.Include(x => x.Customer)
			.Include(x => x.ChatMessages)
			.AsQueryable();

		if (!string.IsNullOrWhiteSpace(keyword))
		{
			var k = keyword.Trim().ToLower();

			query = query.Where(x =>
				(x.Customer.FullName != null && x.Customer.FullName.ToLower().Contains(k)) ||
				x.Customer.Email.ToLower().Contains(k));
		}

		var result = await query
			.OrderByDescending(x => x.LastMessageAt ?? x.UpdatedAt)
			.Select(x => new AdminChatConversationDto
			{
				ConversationId = x.Id,
				CustomerId = x.CustomerId,
				CustomerName = x.Customer.FullName ?? "",
				CustomerEmail = x.Customer.Email,
				LastMessage = x.ChatMessages
					.OrderByDescending(m => m.CreatedAt)
					.Select(m => m.Content)
					.FirstOrDefault() ?? "",
				LastMessageAt = x.LastMessageAt,
				UnreadCount = x.ChatMessages.Count(m => m.SenderRole == "customer" && !m.IsReadByAdmin)
			})
			.ToListAsync();

		return Ok(result);
	}

	[HttpGet("conversations/{conversationId}/messages")]
	public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(long conversationId)
	{
		var conversation = await _db.ChatConversations
			.FirstOrDefaultAsync(x => x.Id == conversationId);

		if (conversation == null)
			return NotFound("Không tìm thấy cuộc trò chuyện.");

		var messages = await _db.ChatMessages
			.Where(x => x.ConversationId == conversationId)
			.OrderBy(x => x.CreatedAt)
			.Select(x => new ChatMessageDto
			{
				Id = x.Id,
				SenderRole = x.SenderRole,
				SenderName = x.SenderUser != null ? (x.SenderUser.FullName ?? x.SenderUser.Email) : "",
				Content = x.Content,
				CreatedAt = x.CreatedAt
			})
			.ToListAsync();

		return Ok(messages);
	}

	[HttpPost("conversations/{conversationId}/messages")]
	public async Task<ActionResult> SendMessage(long conversationId, [FromBody] SendChatMessageRequest req)
	{
		var conversation = await _db.ChatConversations
			.FirstOrDefaultAsync(x => x.Id == conversationId);

		if (conversation == null)
			return NotFound("Không tìm thấy cuộc trò chuyện.");

		if (string.IsNullOrWhiteSpace(req.Content))
			return BadRequest("Nội dung tin nhắn là bắt buộc.");

		var adminUserId = User.Claims.FirstOrDefault(x => x.Type.EndsWith("nameidentifier"))?.Value;
		long? senderId = null;

		if (long.TryParse(adminUserId, out var parsedId))
			senderId = parsedId;

		var msg = new ChatMessage
		{
			ConversationId = conversationId,
			SenderUserId = senderId,
			SenderRole = "admin",
			Content = req.Content.Trim(),
			IsReadByAdmin = true,
			IsReadByCustomer = false,
			CreatedAt = DateTime.Now
		};

		_db.ChatMessages.Add(msg);

		conversation.UpdatedAt = DateTime.Now;
		conversation.LastMessageAt = DateTime.Now;

		await _db.SaveChangesAsync();

		return Ok(new { message = "Gửi phản hồi thành công." });
	}

	[HttpPut("conversations/{conversationId}/read")]
	public async Task<ActionResult> MarkRead(long conversationId)
	{
		var unreadMessages = await _db.ChatMessages
			.Where(x => x.ConversationId == conversationId
				&& x.SenderRole == "customer"
				&& !x.IsReadByAdmin)
			.ToListAsync();

		foreach (var item in unreadMessages)
			item.IsReadByAdmin = true;

		if (unreadMessages.Count > 0)
			await _db.SaveChangesAsync();

		return Ok(new { message = "Đã đánh dấu đã đọc." });
	}
}