using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Product
{
	public long Id { get; set; }

	public long CategoryId { get; set; }

	public string Slug { get; set; } = null!;

	public decimal? BasePrice { get; set; }

	public string Status { get; set; } = null!;

	public bool IsFeatured { get; set; }

	public DateTime? CreatedAt { get; set; }

	public DateTime? UpdatedAt { get; set; }
}
