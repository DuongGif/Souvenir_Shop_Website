using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class InventoryTransaction
{
    public long Id { get; set; }

    public long VariantId { get; set; }

    public string Type { get; set; } = null!;

    public int Quantity { get; set; }

    public string? ReferenceType { get; set; }

    public long? ReferenceId { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }
}
