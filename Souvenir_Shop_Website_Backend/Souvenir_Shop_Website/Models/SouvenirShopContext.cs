using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Souvenir_Shop_Website.Models;

public partial class SouvenirShopContext : DbContext
{
    public SouvenirShopContext(DbContextOptions<SouvenirShopContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CategoryTranslation> CategoryTranslations { get; set; }

    public virtual DbSet<Coupon> Coupons { get; set; }

    public virtual DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderCoupon> OrderCoupons { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<OrderStatusLog> OrderStatusLogs { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PickupLocation> PickupLocations { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<ProductTranslation> ProductTranslations { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ReviewReply> ReviewReplies { get; set; }

    public virtual DbSet<Shipment> Shipments { get; set; }

    public virtual DbSet<User> Users { get; set; }

	public virtual DbSet<EmailOtp> EmailOtps { get; set; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
		modelBuilder.Entity<EmailOtp>(entity =>
		{
			entity.ToTable("email_otps");

			entity.HasKey(e => e.Id);

			entity.Property(e => e.Id).HasColumnName("id");
			entity.Property(e => e.Email)
				.HasMaxLength(255)
				.HasColumnName("email");
			entity.Property(e => e.Purpose)
				.HasMaxLength(50)
				.HasColumnName("purpose");
			entity.Property(e => e.CodeHash)
				.HasMaxLength(128)
				.HasColumnName("code_hash");
			entity.Property(e => e.ExpiresAt)
				.HasColumnType("datetime")
				.HasColumnName("expires_at");
			entity.Property(e => e.CreatedAt)
				.HasColumnType("datetime")
				.HasColumnName("created_at");
			entity.Property(e => e.UsedAt)
				.HasColumnType("datetime")
				.HasColumnName("used_at");
			entity.Property(e => e.AttemptCount)
				.HasColumnName("attempt_count");
		});

		modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__addresse__3213E83FEC4D628C");

            entity.ToTable("addresses");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddressLine1)
                .HasMaxLength(255)
                .HasColumnName("address_line1");
            entity.Property(e => e.AddressLine2)
                .HasMaxLength(255)
                .HasColumnName("address_line2");
            entity.Property(e => e.Country)
                .HasMaxLength(10)
                .HasDefaultValue("VN")
                .HasColumnName("country");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.District)
                .HasMaxLength(100)
                .HasColumnName("district");
            entity.Property(e => e.IsDefault).HasColumnName("is_default");
            entity.Property(e => e.PostalCode)
                .HasMaxLength(20)
                .HasColumnName("postal_code");
            entity.Property(e => e.Province)
                .HasMaxLength(100)
                .HasColumnName("province");
            entity.Property(e => e.RecipientName)
                .HasMaxLength(255)
                .HasColumnName("recipient_name");
            entity.Property(e => e.RecipientPhone)
                .HasMaxLength(50)
                .HasColumnName("recipient_phone");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Ward)
                .HasMaxLength(100)
                .HasColumnName("ward");
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__carts__3213E83FCB940D20");

            entity.ToTable("carts");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.SessionToken)
                .HasMaxLength(255)
                .HasColumnName("session_token");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__cart_ite__3213E83FD99D5FF2");

            entity.ToTable("cart_items");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CartId).HasColumnName("cart_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Quantity)
                .HasDefaultValue(1)
                .HasColumnName("quantity");
            entity.Property(e => e.VariantId).HasColumnName("variant_id");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__categori__3213E83F0C7C030B");

            entity.ToTable("categories");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsVisible)
                .HasDefaultValue(true)
                .HasColumnName("is_visible");
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.Slug)
                .HasMaxLength(255)
                .HasColumnName("slug");
        });

        modelBuilder.Entity<CategoryTranslation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__category__3213E83F36543A86");

            entity.ToTable("category_translations");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Language)
                .HasMaxLength(10)
                .HasColumnName("language");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__coupons__3213E83F6176C5A0");

            entity.ToTable("coupons");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.EndAt).HasColumnName("end_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MaximumDiscount)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("maximum_discount");
            entity.Property(e => e.MinimumOrderValue)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("minimum_order_value");
            entity.Property(e => e.PerUserLimit).HasColumnName("per_user_limit");
            entity.Property(e => e.StartAt).HasColumnName("start_at");
            entity.Property(e => e.TotalUsageLimit).HasColumnName("total_usage_limit");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.Value)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("value");
        });

        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__inventor__3213E83F68690136");

            entity.ToTable("inventory_transactions");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.ReferenceId).HasColumnName("reference_id");
            entity.Property(e => e.ReferenceType)
                .HasMaxLength(50)
                .HasColumnName("reference_type");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.VariantId).HasColumnName("variant_id");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__orders__3213E83F9F5E7B63");

            entity.ToTable("orders");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .HasDefaultValue("VND")
                .HasColumnName("currency");
            entity.Property(e => e.DiscountAmount)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("discount_amount");
            entity.Property(e => e.FulfillmentType)
                .HasMaxLength(20)
                .HasDefaultValue("delivery")
                .HasColumnName("fulfillment_type");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.OrderCode)
                .HasMaxLength(50)
                .HasColumnName("order_code");
            entity.Property(e => e.PickupLocationId).HasColumnName("pickup_location_id");
            entity.Property(e => e.ShippingAddressId).HasColumnName("shipping_address_id");
            entity.Property(e => e.ShippingFee)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("shipping_fee");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("pending")
                .HasColumnName("status");
            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("subtotal");
            entity.Property(e => e.TotalAmount)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("total_amount");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        modelBuilder.Entity<OrderCoupon>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__order_co__3213E83F4BB69BBF");

            entity.ToTable("order_coupons");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CouponId).HasColumnName("coupon_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.DiscountAmount)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("discount_amount");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__order_it__3213E83F025A8250");

            entity.ToTable("order_items");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.LineTotal)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("line_total");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ProductNameSnapshot)
                .HasMaxLength(255)
                .HasColumnName("product_name_snapshot");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("unit_price");
            entity.Property(e => e.VariantId).HasColumnName("variant_id");
            entity.Property(e => e.VariantNameSnapshot)
                .HasMaxLength(255)
                .HasColumnName("variant_name_snapshot");
        });

        modelBuilder.Entity<OrderStatusLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__order_st__3213E83FE3FF3EEA");

            entity.ToTable("order_status_logs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.FromStatus)
                .HasMaxLength(30)
                .HasColumnName("from_status");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ToStatus)
                .HasMaxLength(30)
                .HasColumnName("to_status");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__payments__3213E83F5C11355E");

            entity.ToTable("payments");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("amount");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.GatewayResponse).HasColumnName("gateway_response");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(30)
                .HasColumnName("payment_method");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("status");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(100)
                .HasColumnName("transaction_code");
        });

        modelBuilder.Entity<PickupLocation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__pickup_l__3213E83F79E29CD1");

            entity.ToTable("pickup_locations");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Latitude)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("longitude");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.OpeningHours)
                .HasMaxLength(255)
                .HasColumnName("opening_hours");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__products__3213E83FDA681AE5");

            entity.ToTable("products");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BasePrice)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("base_price");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsFeatured).HasColumnName("is_featured");
            entity.Property(e => e.Slug)
                .HasMaxLength(255)
                .HasColumnName("slug");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__product___3213E83FE493547F");

            entity.ToTable("product_images");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(2048)
                .HasColumnName("image_url");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
        });

        modelBuilder.Entity<ProductTranslation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__product___3213E83FF15B260D");

            entity.ToTable("product_translations");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Language)
                .HasMaxLength(10)
                .HasColumnName("language");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ShortDescription)
                .HasMaxLength(500)
                .HasColumnName("short_description");
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__product___3213E83FCFEDF683");

            entity.ToTable("product_variants");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("price");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .HasColumnName("sku");
            entity.Property(e => e.VariantName)
                .HasMaxLength(255)
                .HasColumnName("variant_name");
            entity.Property(e => e.WeightGrams).HasColumnName("weight_grams");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__reviews__3213E83FE24E0F60");

            entity.ToTable("reviews");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.OrderItemId).HasColumnName("order_item_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        modelBuilder.Entity<ReviewReply>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__review_r__3213E83F922AF9E9");

            entity.ToTable("review_replies");

            entity.HasIndex(e => e.AdminUserId, "idx_review_replies_admin_user_id");

            entity.HasIndex(e => e.ReviewId, "idx_review_replies_review_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AdminUserId).HasColumnName("admin_user_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.ReviewId).HasColumnName("review_id");

            entity.HasOne(d => d.AdminUser).WithMany(p => p.ReviewReplies)
                .HasForeignKey(d => d.AdminUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_review_replies_admin");

            entity.HasOne(d => d.Review).WithMany(p => p.ReviewReplies)
                .HasForeignKey(d => d.ReviewId)
                .HasConstraintName("fk_review_replies_review");
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__shipment__3213E83F0E9F28CB");

            entity.ToTable("shipments");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Carrier)
                .HasMaxLength(50)
                .HasColumnName("carrier");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.DeliveredAt).HasColumnName("delivered_at");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ShippedAt).HasColumnName("shipped_at");
            entity.Property(e => e.ShippingAddressSnapshot).HasColumnName("shipping_address_snapshot");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("preparing")
                .HasColumnName("status");
            entity.Property(e => e.TrackingNumber)
                .HasMaxLength(100)
                .HasColumnName("tracking_number");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__users__3213E83FCCCE1F19");

            entity.ToTable("users");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(255)
                .HasColumnName("full_name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .HasColumnName("phone");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasDefaultValue("customer")
                .HasColumnName("role");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
