using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class ProductVariant
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public string Sku { get; set; } = null!;

    public string VariantName { get; set; } = null!;

    public decimal? Price { get; set; }

    public int? WeightGrams { get; set; }

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }
}
