using Microsoft.AspNetCore.Mvc;
using Souvenir_Shop_Website.Services;
using System.Net;
using Souvenir_Shop_Website.DTOs.Contact;

namespace Souvenir_Shop_Website.Controllers.API;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
	private readonly EmailService _emailService;
	private readonly IConfiguration _config;

	public ContactController(EmailService emailService, IConfiguration config)
	{
		_emailService = emailService;
		_config = config;
	}

	[HttpPost]
	public async Task<IActionResult> SendContact([FromBody] ContactRequest req)
	{
		if (req == null)
			return BadRequest("Dữ liệu liên hệ không hợp lệ.");

		if (string.IsNullOrWhiteSpace(req.FullName))
			return BadRequest("Vui lòng nhập họ và tên.");

		if (string.IsNullOrWhiteSpace(req.Email))
			return BadRequest("Vui lòng nhập email.");

		if (string.IsNullOrWhiteSpace(req.Message))
			return BadRequest("Vui lòng nhập nội dung liên hệ.");

		var toEmail = _config["Contact:ReceiveEmail"];
		if (string.IsNullOrWhiteSpace(toEmail))
			return StatusCode(500, "Chưa cấu hình email nhận liên hệ.");

		var subject = string.IsNullOrWhiteSpace(req.Subject)
			? $"[SouVN Contact] Liên hệ mới từ {req.FullName.Trim()}"
			: $"[SouVN Contact] {req.Subject.Trim()}";

		var htmlBody = $@"
			<div style='font-family:Arial,sans-serif;line-height:1.6'>
				<h2>Liên hệ mới từ website SouVN</h2>
				<p><strong>Họ và tên:</strong> {WebUtility.HtmlEncode(req.FullName.Trim())}</p>
				<p><strong>Email:</strong> {WebUtility.HtmlEncode(req.Email.Trim())}</p>
				<p><strong>Số điện thoại:</strong> {WebUtility.HtmlEncode(req.Phone?.Trim() ?? "")}</p>
				<p><strong>Chủ đề:</strong> {WebUtility.HtmlEncode(req.Subject?.Trim() ?? "")}</p>
				<p><strong>Nội dung:</strong></p>
				<div style='padding:12px;border:1px solid #ddd;border-radius:8px;background:#f9f9f9;white-space:pre-wrap'>
					{WebUtility.HtmlEncode(req.Message.Trim())}
				</div>
			</div>";

		await _emailService.SendHtmlAsync(toEmail, subject, htmlBody);

		return Ok(new
		{
			message = "Gửi liên hệ thành công. SouVN sẽ phản hồi bạn sớm nhất có thể."
		});
	}
}