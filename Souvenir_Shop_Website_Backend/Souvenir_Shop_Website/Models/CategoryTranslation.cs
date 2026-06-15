using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public class CategoryTranslation
{
	public long Id { get; set; }

	public long CategoryId { get; set; }

	public string Language { get; set; } = "";

	public string Name { get; set; } = "";

	public string? Description { get; set; }

	public DateTime CreatedAt { get; set; }

	public Category Category { get; set; }
}
