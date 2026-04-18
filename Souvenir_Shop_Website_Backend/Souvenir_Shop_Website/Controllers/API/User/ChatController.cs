using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Chat;
using Souvenir_Shop_Website.Models;
using System.Security.Claims;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
	private readonly SouvenirShopContext _db;

	public ChatController(SouvenirShopContext db)
	{
		_db = db;
	}

	private long CurrentUserId()
		=> long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

	[HttpPost("open")]
	public async Task<ActionResult<ChatOpenResponseDto>> OpenOrGetConversation()
	{
		var userId = CurrentUserId();

		var conversation = await _db.ChatConversations
			.FirstOrDefaultAsync(x => x.CustomerId == userId && x.Status == "open");

		if (conversation == null)
		{
			conversation = new ChatConversation
			{
				CustomerId = userId,
				Status = "open",
				CreatedAt = DateTime.Now,
				UpdatedAt = DateTime.Now,
				LastMessageAt = null
			};

			_db.ChatConversations.Add(conversation);
			await _db.SaveChangesAsync();
		}

		return Ok(new ChatOpenResponseDto
		{
			ConversationId = conversation.Id
		});
	}

	[HttpGet("conversations/{conversationId}/messages")]
	public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(long conversationId)
	{
		var userId = CurrentUserId();

		var conversation = await _db.ChatConversations
			.FirstOrDefaultAsync(x => x.Id == conversationId && x.CustomerId == userId);

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

		var unreadAdminMessages = await _db.ChatMessages
			.Where(x => x.ConversationId == conversationId
				&& x.SenderRole == "admin"
				&& !x.IsReadByCustomer)
			.ToListAsync();

		foreach (var item in unreadAdminMessages)
			item.IsReadByCustomer = true;

		if (unreadAdminMessages.Count > 0)
			await _db.SaveChangesAsync();

		return Ok(messages);
	}

	[HttpPost("conversations/{conversationId}/messages")]
	public async Task<ActionResult> SendMessage(long conversationId, [FromBody] SendChatMessageRequest req)
	{
		var userId = CurrentUserId();

		var conversation = await _db.ChatConversations
			.FirstOrDefaultAsync(x => x.Id == conversationId && x.CustomerId == userId);

		if (conversation == null)
			return NotFound("Không tìm thấy cuộc trò chuyện.");

		if (string.IsNullOrWhiteSpace(req.Content))
			return BadRequest("Nội dung tin nhắn là bắt buộc.");

		var msg = new ChatMessage
		{
			ConversationId = conversationId,
			SenderUserId = userId,
			SenderRole = "customer",
			Content = req.Content.Trim(),
			IsReadByAdmin = false,
			IsReadByCustomer = true,
			CreatedAt = DateTime.Now
		};

		_db.ChatMessages.Add(msg);

		conversation.UpdatedAt = DateTime.Now;
		conversation.LastMessageAt = DateTime.Now;

		await _db.SaveChangesAsync();

		return Ok(new { message = "Gửi tin nhắn thành công." });
	}
}