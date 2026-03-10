using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class OrderCoupon
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public long CouponId { get; set; }

    public decimal DiscountAmount { get; set; }

    public DateTime? CreatedAt { get; set; }
}
