using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class ProductImage
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public string ImageUrl { get; set; } = null!;
}
