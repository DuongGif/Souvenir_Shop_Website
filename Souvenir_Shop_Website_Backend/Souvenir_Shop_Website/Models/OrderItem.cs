using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class OrderItem
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public long VariantId { get; set; }

    public string ProductNameSnapshot { get; set; } = null!;

    public string VariantNameSnapshot { get; set; } = null!;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal LineTotal { get; set; }

    public DateTime? CreatedAt { get; set; }
}
