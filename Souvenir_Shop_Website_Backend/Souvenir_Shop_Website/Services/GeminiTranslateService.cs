namespace Souvenir_Shop_Website.Services
{
	using Google.GenAI;
	using Microsoft.Extensions.Options;
	using Souvenir_Shop_Website.Options;

	public class GeminiTranslateService
	{
		private readonly GeminiOptions _options;

		public GeminiTranslateService(IOptions<GeminiOptions> options)
		{
			_options = options.Value;
		}

		public async Task<string> TranslateAsync(string text, string targetLanguage)
		{
			if (string.IsNullOrWhiteSpace(text))
				return "";

			var client = new Client(apiKey: _options.ApiKey);

			var prompt = $"""
			You are a professional translator for a Vietnamese souvenir e-commerce website.
			Translate the following text into {targetLanguage}.
			Keep the translation natural, concise, and suitable for online shopping.
			Return only the translated text, with no explanation.

			Text:
			{text}
			""";

			var response = await client.Models.GenerateContentAsync(
				model: _options.Model,
				contents: prompt
			);

			return response.Text?.Trim() ?? "";
		}
	}
}
