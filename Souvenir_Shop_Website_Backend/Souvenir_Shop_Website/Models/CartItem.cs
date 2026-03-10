using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class CartItem
{
    public long Id { get; set; }

    public long CartId { get; set; }

    public long VariantId { get; set; }

    public int Quantity { get; set; }

    public DateTime? CreatedAt { get; set; }
}
