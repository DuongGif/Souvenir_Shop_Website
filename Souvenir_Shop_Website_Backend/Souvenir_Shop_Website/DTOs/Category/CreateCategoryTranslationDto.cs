namespace Souvenir_Shop_Website.DTOs.Category
{
	public class CreateCategoryTranslationDto
	{
		public string Language { get; set; } = "";

		public string Name { get; set; } = "";

		public string? Description { get; set; }
	}
}
