import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { cartService } from "../services/cartService";
import { couponService } from "../services/couponService";
import { orderService } from "../services/orderService";
import { accountService } from "../services/accountService";

const API_ORIGIN = "https://localhost:7020";

const getImageSrc = (url) => {
  if (!url) return "/no-image.png";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

const slugToTitle = (slug = "") => {
  if (!slug) return "Sản phẩm lưu niệm";
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const firstError = Object.values(data.errors)?.flat?.()[0];
    if (firstError) return firstError;
  }
  return fallback;
};

const glassCard = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 24,
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
  backdropFilter: "blur(6px)",
};

const whiteCard = {
  background: "#fff",
  borderRadius: 24,
  boxShadow: "0 16px 38px rgba(0,0,0,0.10)",
};

const blockTitleStyle = {
  color: "#0f172a",
  fontWeight: 800,
  marginBottom: 16,
};

const inputStyle = {
  height: 48,
  borderRadius: 14,
  color: "#111827",
  border: "1px solid #e2e8f0",
  boxShadow: "none",
};

export default function CartPage() {
  const nav = useNavigate();

  const [cart, setCart] = useState({ items: [], subtotal: 0, cartId: 0 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const [cartRes, addressRes] = await Promise.all([
        cartService.get(),
        accountService.getAddresses(),
      ]);

      const cartData = cartRes.data || { items: [], subtotal: 0, cartId: 0 };
      const addressData = addressRes.data || [];

      setCart(cartData);
      setAddresses(addressData);

      const defaultAddress = addressData.find((a) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
      } else if (addressData.length > 0) {
        setSelectedAddressId(String(addressData[0].id));
      } else {
        setSelectedAddressId("");
      }
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải giỏ hàng"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const discountAmount = couponInfo?.isValid
    ? Number(couponInfo.discountAmount || 0)
    : 0;

  const finalTotal = useMemo(() => {
    return Math.max(0, Number(cart.subtotal || 0) - discountAmount);
  }, [cart.subtotal, discountAmount]);

  const updateQty = async (itemId, quantity) => {
    setErr("");
    setMsg("");

    const safeQty = Math.max(1, Number(quantity || 1));

    try {
      await cartService.updateItem(itemId, { quantity: safeQty });
      await load();
      setMsg("Đã cập nhật số lượng sản phẩm");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Cập nhật số lượng thất bại"));
    }
  };

  const removeItem = async (itemId) => {
    setErr("");
    setMsg("");

    try {
      await cartService.deleteItem(itemId);
      await load();
      setMsg("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa sản phẩm thất bại"));
    }
  };

  const validateCoupon = async () => {
    setErr("");
    setMsg("");
    setCouponInfo(null);

    if (!couponCode.trim()) {
      setErr("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setCheckingCoupon(true);
      const res = await couponService.validate({
        code: couponCode.trim(),
        subtotal: cart.subtotal,
      });
      setCouponInfo(res.data);

      if (res.data?.isValid) {
        setMsg("Mã giảm giá hợp lệ");
      } else {
        setErr(res.data?.message || "Mã giảm giá không hợp lệ");
      }
    } catch (ex) {
      setErr(getErrorMessage(ex, "Kiểm tra mã giảm giá thất bại"));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const checkout = async () => {
    setErr("");
    setMsg("");

    if ((cart.items || []).length === 0) {
      setErr("Giỏ hàng đang trống");
      return;
    }

    if (!selectedAddressId) {
      setErr("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    try {
      setCheckingOut(true);

      const payload = {
        shippingAddressId: Number(selectedAddressId),
        fulfillmentType: "delivery",
      };

      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }

      const res = await orderService.create(payload);
      const orderCode = res.data.orderCode;
      nav(`/payment/${orderCode}`);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Tạo đơn hàng thất bại"));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <MainLayout>
      <section
        className="section"
        style={{
          background:
            "radial-gradient(circle at top center, rgba(56,189,248,0.10), transparent 24%), linear-gradient(180deg, #04131f 0%, #071a29 60%, #0a1f31 100%)",
          paddingTop: 50,
          paddingBottom: 60,
        }}
      >
        <div className="container" data-aos="fade-up">
          <div
            className="text-center mb-5"
            style={{
              paddingTop: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(56,189,248,0.12)",
                color: "#38bdf8",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 24,
                border: "1px solid rgba(56,189,248,0.18)",
                boxShadow: "0 10px 30px rgba(13,110,253,0.15)",
              }}
            >
              <i className="bi bi-cart-check-fill"></i>
              Giỏ hàng SouVN
            </span>

            <h2
              style={{
                fontWeight: 800,
                marginBottom: 20,
                color: "#f8fafc",
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                textShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
            >
              Kiểm tra và hoàn tất đơn hàng của bạn
            </h2>

            <p
              style={{
                maxWidth: 860,
                margin: "0 auto",
                color: "rgba(226,232,240,0.86)",
                lineHeight: 1.9,
                fontSize: 18,
              }}
            >
              Xem lại sản phẩm đã chọn, cập nhật số lượng, áp dụng mã giảm giá và
              tiến hành đặt hàng một cách nhanh chóng.
            </p>
          </div>

          {err && (
            <div
              className="alert mb-4"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 16,
              }}
            >
              {err}
            </div>
          )}

          {msg && (
            <div
              className="alert mb-4"
              style={{
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                borderRadius: 16,
              }}
            >
              {msg}
            </div>
          )}

          {loading ? (
            <div
              className="text-center py-5"
              style={{
                ...glassCard,
                padding: 40,
              }}
            >
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#cbd5e1" }}>
                Đang tải giỏ hàng...
              </p>
            </div>
          ) : (cart.items || []).length === 0 ? (
            <div
              style={{
                ...whiteCard,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: "50%",
                  margin: "0 auto 18px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(13,110,253,0.10)",
                  color: "#0d6efd",
                  fontSize: 30,
                }}
              >
                <i className="bi bi-cart-x"></i>
              </div>

              <h4 style={{ color: "#0f172a", fontWeight: 800 }}>
                Giỏ hàng đang trống
              </h4>
              <p style={{ color: "#64748b", marginBottom: 20 }}>
                Bạn chưa thêm sản phẩm nào vào giỏ hàng.
              </p>
              <Link
                to="/products"
                className="btn btn-primary"
                style={{ borderRadius: 14, padding: "11px 24px", fontWeight: 700 }}
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="d-grid gap-3">
                  {(cart.items || []).map((it) => (
                    <div
                      key={it.id}
                      style={{
                        ...whiteCard,
                        padding: 20,
                      }}
                    >
                      <div className="row g-3 align-items-center">
                        <div className="col-md-3">
                          <div
                            style={{
                              background: "#f8fafc",
                              borderRadius: 18,
                              overflow: "hidden",
                              minHeight: 140,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <img
                              src={getImageSrc(it.imageUrl)}
                              alt={it.variantName}
                              style={{
                                width: "100%",
                                height: 140,
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.currentTarget.src = "/no-image.png";
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-md-5">
                          <h5
                            style={{
                              color: "#020a16",
                              fontWeight: 700,
                              marginBottom: 6,
                            }}
                          >
                            {slugToTitle(it.productSlug)}
                          </h5>

                          <div
                            style={{
                              color: "#2563eb",
                              fontWeight: 700,
                              marginBottom: 10,
                              fontSize: 14,
                            }}
                          >
                            Biến thể: {it.variantName}
                          </div>

                          <div style={{ color: "#475569", marginBottom: 6 }}>
                            Đơn giá: <strong>{formatPrice(it.price)}</strong>
                          </div>

                          <div style={{ color: "#475569" }}>
                            Thành tiền: <strong>{formatPrice(it.lineTotal)}</strong>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 700 }}
                          >
                            Số lượng
                          </label>

                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              style={{ borderRadius: 12, width: 42, height: 42 }}
                              onClick={() => updateQty(it.id, Number(it.quantity) - 1)}
                              disabled={Number(it.quantity) <= 1}
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) =>
                                updateQty(it.id, Number(e.target.value || 1))
                              }
                              className="form-control"
                              style={{
                                width: 90,
                                color: "#111827",
                                borderRadius: 12,
                                textAlign: "center",
                                height: 42,
                              }}
                            />

                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              style={{ borderRadius: 12, width: 42, height: 42 }}
                              onClick={() => updateQty(it.id, Number(it.quantity) + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(it.id)}
                            className="btn btn-outline-danger btn-sm mt-3"
                            style={{ borderRadius: 12, fontWeight: 600 }}
                          >
                            <i className="bi bi-trash3 me-2"></i>
                            Xóa sản phẩm
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-lg-4">
                <div
                  style={{
                    ...whiteCard,
                    padding: 24,
                    marginBottom: 20,
                  }}
                >
                  <h4 style={blockTitleStyle}>Mã giảm giá</h4>

                  <div className="d-grid gap-3">
                    <input
                      className="form-control"
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      style={inputStyle}
                    />

                    <button
                      onClick={validateCoupon}
                      className="btn btn-outline-primary"
                      disabled={checkingCoupon}
                      style={{ borderRadius: 14, height: 48, fontWeight: 700 }}
                    >
                      {checkingCoupon ? "Đang kiểm tra..." : "Áp dụng mã"}
                    </button>
                  </div>

                  {couponInfo && (
                    <div
                      className="mt-3"
                      style={{
                        background: "#f8fafc",
                        borderRadius: 16,
                        padding: 16,
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <strong>Hợp lệ:</strong> {String(couponInfo.isValid)}
                      </div>
                      <div>
                        <strong>Thông báo:</strong> {couponInfo.message}
                      </div>
                      <div>
                        <strong>Giảm giá:</strong> {formatPrice(couponInfo.discountAmount)}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...whiteCard,
                    padding: 24,
                    marginBottom: 20,
                  }}
                >
                  <h4 style={blockTitleStyle}>Địa chỉ giao hàng</h4>

                  {addresses.length === 0 ? (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 16,
                        padding: 16,
                        color: "#475569",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Bạn chưa có địa chỉ giao hàng.{" "}
                      <Link to="/account" style={{ fontWeight: 700 }}>
                        Thêm địa chỉ ngay
                      </Link>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Chọn địa chỉ giao hàng</option>
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.recipientName} - {addr.recipientPhone} -{" "}
                          {[addr.addressLine1, addr.district, addr.province]
                            .filter(Boolean)
                            .join(", ")}
                          {addr.isDefault ? " (Mặc định)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div
                  style={{
                    ...whiteCard,
                    padding: 24,
                  }}
                >
                  <h4 style={blockTitleStyle}>Tóm tắt đơn hàng</h4>

                  <div className="d-grid gap-2" style={{ color: "#334155" }}>
                    <div className="d-flex justify-content-between">
                      <span>Tạm tính</span>
                      <strong>{formatPrice(cart.subtotal)}</strong>
                    </div>

                    <div className="d-flex justify-content-between">
                      <span>Giảm giá</span>
                      <strong>- {formatPrice(discountAmount)}</strong>
                    </div>

                    <hr />

                    <div
                      className="d-flex justify-content-between"
                      style={{ fontSize: 20, color: "#0f172a" }}
                    >
                      <span>Tổng cộng</span>
                      <strong>{formatPrice(finalTotal)}</strong>
                    </div>
                  </div>

                  <button
                    onClick={checkout}
                    disabled={checkingOut || (cart.items || []).length === 0}
                    className="btn btn-primary w-100 mt-4"
                    style={{
                      height: 50,
                      borderRadius: 14,
                      fontWeight: 700,
                      boxShadow: "0 12px 24px rgba(13,110,253,0.18)",
                    }}
                  >
                    {checkingOut ? "Đang tạo đơn..." : "Tiến hành thanh toán"}
                  </button>

                  <Link
                    to="/products"
                    className="btn btn-outline-secondary w-100 mt-3"
                    style={{
                      height: 50,
                      borderRadius: 14,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}