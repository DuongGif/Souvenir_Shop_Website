using System;
using System.Collections.Generic;

namespace Souvenir_Shop_Website.Models;

public partial class User
{
    public long Id { get; set; }

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string PasswordHash { get; set; } = null!;

    public string? FullName { get; set; }

    public string Role { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ReviewReply> ReviewReplies { get; set; } = new List<ReviewReply>();
}
