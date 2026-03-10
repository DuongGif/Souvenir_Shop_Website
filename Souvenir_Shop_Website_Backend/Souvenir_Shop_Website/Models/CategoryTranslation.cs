using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class CategoryTranslation
{
    public long Id { get; set; }

    public long CategoryId { get; set; }

    public string Language { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }
}
