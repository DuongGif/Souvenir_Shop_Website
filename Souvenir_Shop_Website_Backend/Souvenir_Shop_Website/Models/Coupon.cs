using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Coupon
{
    public long Id { get; set; }

    public string Code { get; set; } = null!;

    public string Type { get; set; } = null!;

    public decimal Value { get; set; }

    public decimal? MinimumOrderValue { get; set; }

    public decimal? MaximumDiscount { get; set; }

    public DateTime? StartAt { get; set; }

    public DateTime? EndAt { get; set; }

    public int? TotalUsageLimit { get; set; }

    public int? PerUserLimit { get; set; }

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }
}
