using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class ProductTranslation
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public string Language { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }
}
