using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Shipment
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public string? Carrier { get; set; }

    public string? TrackingNumber { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public string? ShippingAddressSnapshot { get; set; }

    public DateTime? CreatedAt { get; set; }
}
