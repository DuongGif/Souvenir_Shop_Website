using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Order
{
    public long Id { get; set; }

    public string OrderCode { get; set; } = null!;

    public long? UserId { get; set; }

    public string Status { get; set; } = null!;

    public string Currency { get; set; } = null!;

    public decimal Subtotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Note { get; set; }

    public string FulfillmentType { get; set; } = null!;

    public long? PickupLocationId { get; set; }

    public long? ShippingAddressId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
