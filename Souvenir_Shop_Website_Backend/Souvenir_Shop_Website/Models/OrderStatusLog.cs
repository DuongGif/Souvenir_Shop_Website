using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class OrderStatusLog
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public string? FromStatus { get; set; }

    public string ToStatus { get; set; } = null!;

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }
}
