using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class ReviewReply
{
    public long Id { get; set; }

    public long ReviewId { get; set; }

    public long AdminUserId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual User AdminUser { get; set; } = null!;

    public virtual Review Review { get; set; } = null!;
}
