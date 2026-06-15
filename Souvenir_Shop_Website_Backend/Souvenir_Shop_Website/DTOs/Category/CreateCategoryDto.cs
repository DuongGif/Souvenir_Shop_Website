namespace Souvenir_Shop_Website.DTOs.Category
{
	public class CreateCategoryDto
	{
		public string Slug { get; set; } = "";

		public long? ParentCategoryId { get; set; }

		public bool IsVisible { get; set; }

		public List<CreateCategoryTranslationDto> Translations { get; set; }
			= new();
	}
}
