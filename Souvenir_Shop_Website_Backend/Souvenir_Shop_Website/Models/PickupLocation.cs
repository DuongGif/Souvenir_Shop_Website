using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class PickupLocation
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public string? OpeningHours { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }
}
