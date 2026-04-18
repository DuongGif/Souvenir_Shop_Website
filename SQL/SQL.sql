IF DB_ID(N'Souvenir_shop') IS NULL
  CREATE DATABASE Souvenir_shop;
GO
USE Souvenir_shop;
GO

-- USERS
CREATE TABLE dbo.users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(50) NULL,
  password_hash NVARCHAR(255) NOT NULL,
  full_name NVARCHAR(255) NULL,
  role NVARCHAR(20) NOT NULL DEFAULT 'customer',
  status NVARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME2 NULL,
  updated_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.addresses (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recipient_name NVARCHAR(255) NOT NULL,
  recipient_phone NVARCHAR(50) NOT NULL,
  address_line1 NVARCHAR(255) NOT NULL,
  address_line2 NVARCHAR(255) NULL,
  ward NVARCHAR(100) NULL,
  district NVARCHAR(100) NULL,
  province NVARCHAR(100) NULL,
  country NVARCHAR(10) NOT NULL DEFAULT 'VN',
  postal_code NVARCHAR(20) NULL,
  is_default BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NULL
);
GO

-- CATEGORIES
CREATE TABLE dbo.categories (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  parent_id BIGINT NULL,
  slug NVARCHAR(255) NOT NULL,
  is_visible BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.category_translations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  category_id BIGINT NOT NULL,
  language NVARCHAR(10) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX) NULL,
  created_at DATETIME2 NULL
);
GO

-- PRODUCTS
CREATE TABLE dbo.products (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  category_id BIGINT NOT NULL,
  slug NVARCHAR(255) NOT NULL,
  base_price DECIMAL(12,2) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'active',
  is_featured BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NULL,
  updated_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.product_translations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  product_id BIGINT NOT NULL,
  language NVARCHAR(10) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  short_description NVARCHAR(500) NULL,
  description NVARCHAR(MAX) NULL,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.product_images (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  product_id BIGINT NOT NULL,
  image_url NVARCHAR(2048) NOT NULL
);
GO

-- VARIANTS & INVENTORY
CREATE TABLE dbo.product_variants (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  product_id BIGINT NOT NULL,
  sku NVARCHAR(100) NOT NULL,
  variant_name NVARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NULL,
  weight_grams INT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.inventory_transactions (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  variant_id BIGINT NOT NULL,
  type NVARCHAR(20) NOT NULL,
  quantity INT NOT NULL,
  reference_type NVARCHAR(50) NULL,
  reference_id BIGINT NULL,
  note NVARCHAR(255) NULL,
  created_at DATETIME2 NULL
);
GO

-- CART
CREATE TABLE dbo.carts (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NULL,
  session_token NVARCHAR(255) NULL,
  created_at DATETIME2 NULL,
  updated_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.cart_items (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  variant_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at DATETIME2 NULL
);
GO

-- PICKUP LOCATIONS
CREATE TABLE dbo.pickup_locations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  address NVARCHAR(255) NOT NULL,
  opening_hours NVARCHAR(255) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NULL
);
GO

-- ORDERS
CREATE TABLE dbo.orders (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_code NVARCHAR(50) NOT NULL,
  user_id BIGINT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'pending',
  currency NVARCHAR(10) NOT NULL DEFAULT 'VND',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  note NVARCHAR(MAX) NULL,
  fulfillment_type NVARCHAR(20) NOT NULL DEFAULT 'delivery',
  pickup_location_id BIGINT NULL,
  shipping_address_id BIGINT NULL,
  created_at DATETIME2 NULL,
  updated_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.order_items (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_id BIGINT NOT NULL,
  variant_id BIGINT NOT NULL,
  product_name_snapshot NVARCHAR(255) NOT NULL,
  variant_name_snapshot NVARCHAR(255) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at DATETIME2 NULL
);
GO

-- PAYMENTS & SHIPMENTS
CREATE TABLE dbo.payments (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_id BIGINT NOT NULL,
  payment_method NVARCHAR(30) NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL,
  transaction_code NVARCHAR(100) NULL,
  paid_at DATETIME2 NULL,
  gateway_response NVARCHAR(MAX) NULL,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.shipments (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_id BIGINT NOT NULL,
  carrier NVARCHAR(50) NULL,
  tracking_number NVARCHAR(100) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'preparing',
  shipped_at DATETIME2 NULL,
  delivered_at DATETIME2 NULL,
  shipping_address_snapshot NVARCHAR(MAX) NULL,
  created_at DATETIME2 NULL
);
GO

-- COUPONS
CREATE TABLE dbo.coupons (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(50) NOT NULL,
  type NVARCHAR(20) NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  minimum_order_value DECIMAL(12,2) NULL,
  maximum_discount DECIMAL(12,2) NULL,
  start_at DATETIME2 NULL,
  end_at DATETIME2 NULL,
  total_usage_limit INT NULL,
  per_user_limit INT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE dbo.order_coupons (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_id BIGINT NOT NULL,
  coupon_id BIGINT NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME2 NULL
);
GO

-- REVIEWS
CREATE TABLE dbo.reviews (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  order_item_id BIGINT NULL,
  rating INT NOT NULL,
  title NVARCHAR(255) NULL,
  content NVARCHAR(MAX) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME2 NULL
);
GO

-- ORDER STATUS LOGS
CREATE TABLE dbo.order_status_logs (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  order_id BIGINT NOT NULL,
  from_status NVARCHAR(30) NULL,
  to_status NVARCHAR(30) NOT NULL,
  note NVARCHAR(255) NULL,
  created_at DATETIME2 NULL
);
GO

CREATE TABLE review_replies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id BIGINT NOT NULL,
    admin_user_id BIGINT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NULL
);

ALTER TABLE review_replies
ADD CONSTRAINT fk_review_replies_review
FOREIGN KEY (review_id) REFERENCES reviews(id)
ON DELETE CASCADE;

ALTER TABLE review_replies
ADD CONSTRAINT fk_review_replies_admin
FOREIGN KEY (admin_user_id) REFERENCES users(id);

CREATE INDEX idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX idx_review_replies_admin_user_id ON review_replies(admin_user_id);

ALTER TABLE products
ALTER COLUMN base_price decimal(18,2) NOT NULL;

CREATE TABLE email_otps (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    used_at DATETIME NULL,
    attempt_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IX_email_otps_email_purpose_created_at
ON email_otps(email, purpose, created_at);

CREATE TABLE chat_conversations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    last_message_at DATETIME NULL,

    CONSTRAINT FK_chat_conversations_customer
        FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_user_id BIGINT NULL,
    sender_role VARCHAR(20) NOT NULL, -- customer/admin
    content NVARCHAR(2000) NOT NULL,

    is_read_by_admin BIT NOT NULL DEFAULT 0,
    is_read_by_customer BIT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_chat_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),

    CONSTRAINT FK_chat_messages_sender_user
        FOREIGN KEY (sender_user_id) REFERENCES users(id)
);

CREATE INDEX IX_chat_conversations_customer_id
ON chat_conversations(customer_id);

CREATE INDEX IX_chat_messages_conversation_id
ON chat_messages(conversation_id);

CREATE INDEX IX_chat_messages_conversation_created_at
ON chat_messages(conversation_id, created_at DESC);