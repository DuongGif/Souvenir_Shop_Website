namespace Souvenir_Shop_Website.DTOs.Category;

public class UpdateCategoryTranslationDto
{
	public string Language { get; set; } = string.Empty;

	public string Name { get; set; } = string.Empty;

	public string? Description { get; set; }
}