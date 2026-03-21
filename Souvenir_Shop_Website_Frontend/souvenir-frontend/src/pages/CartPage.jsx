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
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="section-title">
            <h2>Giỏ hàng của bạn</h2>
            <p>
              Kiểm tra sản phẩm đã chọn, cập nhật số lượng, áp dụng mã giảm giá
              và tiến hành đặt hàng.
            </p>
          </div>

          {err && <div className="alert alert-danger">{err}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải giỏ hàng...</p>
            </div>
          ) : (cart.items || []).length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 36,
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <h4 style={{ color: "#0f172a", fontWeight: 700 }}>
                Giỏ hàng đang trống
              </h4>
              <p style={{ color: "#64748b" }}>
                Bạn chưa thêm sản phẩm nào vào giỏ hàng.
              </p>
              <Link
                to="/products"
                className="btn btn-primary"
                style={{ borderRadius: 12, padding: "10px 22px" }}
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
                        background: "#fff",
                        borderRadius: 22,
                        padding: 20,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
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
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            {slugToTitle(it.productSlug)}
                          </h5>

                          <div
                            style={{
                              color: "#586072",
                              fontWeight: 700,
                              marginBottom: 8,
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
                            style={{ color: "#111827", fontWeight: 600 }}
                          >
                            Số lượng
                          </label>

                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              style={{ borderRadius: 10 }}
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
                                borderRadius: 10,
                                textAlign: "center",
                              }}
                            />

                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              style={{ borderRadius: 10 }}
                              onClick={() => updateQty(it.id, Number(it.quantity) + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(it.id)}
                            className="btn btn-outline-danger btn-sm mt-3"
                            style={{ borderRadius: 10 }}
                          >
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
                    background: "#fff",
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 16 }}>
                    Mã giảm giá
                  </h4>

                  <div className="d-grid gap-3">
                    <input
                      className="form-control"
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      style={{ height: 46, borderRadius: 12, color: "#111827" }}
                    />

                    <button
                      onClick={validateCoupon}
                      className="btn btn-outline-primary"
                      disabled={checkingCoupon}
                      style={{ borderRadius: 12, height: 46 }}
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
                    background: "#fff",
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 16 }}>
                    Địa chỉ giao hàng
                  </h4>

                  {addresses.length === 0 ? (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 16,
                        padding: 16,
                        color: "#475569",
                      }}
                    >
                      Bạn chưa có địa chỉ giao hàng.{" "}
                      <Link to="/account" style={{ fontWeight: 600 }}>
                        Thêm địa chỉ ngay
                      </Link>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      style={{ height: 48, borderRadius: 12, color: "#111827" }}
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
                    background: "#fff",
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h4 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 16 }}>
                    Tóm tắt đơn hàng
                  </h4>

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
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                  >
                    {checkingOut ? "Đang tạo đơn..." : "Tiến hành thanh toán"}
                  </button>

                  <Link
                    to="/products"
                    className="btn btn-outline-secondary w-100 mt-3"
                    style={{
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
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