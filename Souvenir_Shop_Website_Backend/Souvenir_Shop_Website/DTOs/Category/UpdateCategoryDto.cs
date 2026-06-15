namespace Souvenir_Shop_Website.DTOs.Category;

public class UpdateCategoryDto
{
	public string Slug { get; set; } = string.Empty;

	public long? ParentCategoryId { get; set; }

	public bool IsVisible { get; set; }

	public List<UpdateCategoryTranslationDto> Translations { get; set; }
		= new();
}