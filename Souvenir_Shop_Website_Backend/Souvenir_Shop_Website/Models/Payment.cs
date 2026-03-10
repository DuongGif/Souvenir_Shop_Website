using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Payment
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public string Status { get; set; } = null!;

    public decimal Amount { get; set; }

    public string? TransactionCode { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? GatewayResponse { get; set; }

    public DateTime? CreatedAt { get; set; }
}
