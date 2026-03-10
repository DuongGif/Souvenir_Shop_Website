using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Category
{
    public long Id { get; set; }

    public long? ParentId { get; set; }

    public string Slug { get; set; } = null!;

    public bool IsVisible { get; set; }

    public DateTime? CreatedAt { get; set; }
}
