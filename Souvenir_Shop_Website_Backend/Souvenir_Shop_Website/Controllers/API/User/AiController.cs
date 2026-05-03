using Microsoft.AspNetCore.Mvc;
using Souvenir_Shop_Website.DTOs.Translate;
using Souvenir_Shop_Website.Services;

namespace Souvenir_Shop_Website.Controllers.API.User
{
	[ApiController]
	[Route("api/ai")]
	public class AiController : ControllerBase
	{
		private readonly GeminiTranslateService _translateService;

		public AiController(GeminiTranslateService translateService)
		{
			_translateService = translateService;
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
	}
}
