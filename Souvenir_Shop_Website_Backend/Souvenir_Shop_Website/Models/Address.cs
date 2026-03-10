using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Address
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public string RecipientName { get; set; } = null!;

    public string RecipientPhone { get; set; } = null!;

    public string AddressLine1 { get; set; } = null!;

    public string? AddressLine2 { get; set; }

    public string? Ward { get; set; }

    public string? District { get; set; }

    public string? Province { get; set; }

    public string Country { get; set; } = null!;

    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; }

    public DateTime? CreatedAt { get; set; }
}
