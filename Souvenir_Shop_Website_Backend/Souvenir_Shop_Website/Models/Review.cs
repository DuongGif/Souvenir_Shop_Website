using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class Review
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public long? UserId { get; set; }

    public long? OrderItemId { get; set; }

    public int Rating { get; set; }

    public string? Title { get; set; }

    public string? Content { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<ReviewReply> ReviewReplies { get; set; } = new List<ReviewReply>();
}
