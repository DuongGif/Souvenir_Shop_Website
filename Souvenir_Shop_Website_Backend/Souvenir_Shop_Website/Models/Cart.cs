using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Cart
{
    public long Id { get; set; }

    public long? UserId { get; set; }

    public string? SessionToken { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
