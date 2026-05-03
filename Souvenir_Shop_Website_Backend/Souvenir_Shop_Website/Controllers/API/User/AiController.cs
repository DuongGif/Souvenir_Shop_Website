using Microsoft.AspNetCore.Mvc;
using Souvenir_Shop_Website.DTOs.Ai;
using Souvenir_Shop_Website.DTOs.Translate;
using Souvenir_Shop_Website.Services;

namespace Souvenir_Shop_Website.Controllers.API.User
{
	[ApiController]
	[Route("api/ai")]
	public class AiController : ControllerBase
	{
		private readonly GeminiTranslateService _translateService;
		private readonly GeminiProductChatService _productChatService;

		public AiController(
			GeminiTranslateService translateService,
			GeminiProductChatService productChatService)
		{
			_translateService = translateService;
			_productChatService = productChatService;
		}

		[HttpPost("translate")]
		public async Task<ActionResult<TranslateResponse>> Translate([FromBody] TranslateRequest req)
		{
			if (string.IsNullOrWhiteSpace(req.Text))
				return BadRequest("Text is required.");

			var translated = await _translateService.TranslateAsync(req.Text, req.TargetLanguage);

			return Ok(new TranslateResponse
			{
				OriginalText = req.Text,
				TargetLanguage = req.TargetLanguage,
				TranslatedText = translated
			});
		}

		[HttpPost("chat-recommend")]
		public async Task<ActionResult<AiChatRecommendResponse>> ChatRecommend(
			[FromBody] AiChatRecommendRequest req,
			CancellationToken cancellationToken)
		{
			if (string.IsNullOrWhiteSpace(req.Message))
				return BadRequest("Message is required.");

			var result = await _productChatService.RecommendAsync(req, cancellationToken);

			return Ok(result);
		}
	}
}