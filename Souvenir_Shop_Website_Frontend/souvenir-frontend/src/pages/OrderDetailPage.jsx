import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { cartService } from "../services/cartService";

const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
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

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan") {
    return { text: "Chờ xử lý", bg: "#fef3c7", color: "#92400e" };
  }

  if (s === "confirmed" || s === "da_xac_nhan") {
    return { text: "Đã xác nhận", bg: "#dbeafe", color: "#1d4ed8" };
  }

  if (s === "paid" || s === "da_thanh_toan") {
    return { text: "Đã thanh toán", bg: "#dcfce7", color: "#166534" };
  }

  if (s === "shipping" || s === "dang_giao") {
    return { text: "Đang giao hàng", bg: "#dbeafe", color: "#1d4ed8" };
  }

  if (s === "completed" || s === "hoan_thanh") {
    return { text: "Hoàn thành", bg: "#dcfce7", color: "#166534" };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return { text: "Đã hủy", bg: "#fee2e2", color: "#991b1b" };
  }

  return {
    text: "Không xác định",
    bg: "#e5e7eb",
    color: "#374151",
  };
};

const getFulfillmentText = (value) => {
  const s = String(value || "").toLowerCase();

  if (s === "delivery" || s === "giao_hang") return "Giao hàng tận nơi";
  if (s === "pickup" || s === "nhan_tai_diem") return "Nhận tại điểm";
  if (s === "hotel" || s === "hotel_delivery" || s === "giao_khach_san") {
    return "Giao tại khách sạn";
  }

  return value || "Không xác định";
};

const glassCard = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 24,
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
  backdropFilter: "blur(6px)",
};

const whiteCard = {
  background: "#ffffff",
  borderRadius: 24,
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
};

const primaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 18px",
  borderRadius: 14,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  width: "100%",
};

const outlineButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  width: "100%",
};

export default function OrderDetailPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await orderService.byCode(orderCode);
        setOrder(res.data);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải chi tiết đơn hàng."));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderCode]);

  const badge = useMemo(() => getStatusBadge(order?.status), [order?.status]);
  const status = String(order?.status || "").toLowerCase();

  const isPending =
    status === "pending" || status === "cho_xu_ly" || status === "cho_xac_nhan";

  const isCanceled =
    status === "cancelled" || status === "canceled" || status === "da_huy";

  const isCompleted =
    status === "completed" || status === "hoan_thanh";

  const canRepurchase = isCanceled || isCompleted;
  const canReview = isCompleted;

  const goToProduct = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy mã sản phẩm.");
      return;
    }

    navigate(`/products/${item.productId}`);
  };

  const goToReview = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy mã sản phẩm để đánh giá.");
      return;
    }

    navigate(`/products/${item.productId}?review=1`);
  };

  const handleContinuePayment = async () => {
    if (!order?.orderCode) return;

    try {
      setActionLoading(true);
      setErr("");

      const res = await paymentService.create({
        orderCode: order.orderCode,
        paymentMethod: "bank_transfer",
      });

      const payment = res?.data;

      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      navigate(`/payment/${order.orderCode}`);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tiếp tục thanh toán đơn hàng này."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyAgain = async () => {
    try {
      setActionLoading(true);
      setErr("");

      const items = order?.items || [];
      let addedCount = 0;

      for (const item of items) {
        if (!item?.variantId) continue;

        await cartService.addItem({
          variantId: item.variantId,
          quantity: item.quantity || 1,
        });

        addedCount++;
      }

      if (addedCount === 0) {
        setErr("Không thể mua lại vì đơn hàng chưa có dữ liệu biến thể sản phẩm.");
        return;
      }

      navigate("/cart");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể mua lại đơn hàng này."));
    } finally {
      setActionLoading(false);
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
          <div className="mb-4">
            <Link
              to="/orders"
              style={{
                color: "#93c5fd",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Quay lại danh sách đơn hàng
            </Link>
          </div>

          {err && (
            <div
              className="alert mb-4"
              role="alert"
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
                Đang tải chi tiết đơn hàng...
              </p>
            </div>
          ) : !order ? (
            <div
              className="alert"
              style={{
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fdba74",
                borderRadius: 16,
              }}
            >
              Không tìm thấy đơn hàng.
            </div>
          ) : (
            <>
              <div className="text-center mb-5" style={{ paddingTop: 8 }}>
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
                  <i className="bi bi-file-earmark-text-fill"></i>
                  Chi tiết đơn hàng
                </span>

                <h2
                  style={{
                    fontWeight: 800,
                    marginBottom: 18,
                    color: "#f8fafc",
                    fontSize: "clamp(30px, 5vw, 52px)",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Đơn hàng: {order.orderCode}
                </h2>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: badge.bg,
                    color: badge.color,
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  {badge.text}
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-4">
                  <div style={{ ...whiteCard, padding: 24 }}>
                    <h3
                      style={{
                        color: "#0f172a",
                        fontWeight: 800,
                        marginBottom: 18,
                        fontSize: 24,
                      }}
                    >
                      Thông tin đơn hàng
                    </h3>

                    <div className="mb-3">
                      <div style={{ color: "#64748b", marginBottom: 6 }}>
                        Mã đơn hàng
                      </div>
                      <div
                        style={{
                          color: "#0f172a",
                          fontWeight: 800,
                          fontSize: 20,
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {order.orderCode}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div style={{ color: "#64748b", marginBottom: 6 }}>
                        Trạng thái
                      </div>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "7px 14px",
                          borderRadius: 999,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    {order.createdAt && (
                      <div className="mb-3" style={{ color: "#475569", lineHeight: 1.8 }}>
                        <strong style={{ color: "#0f172a" }}>Ngày tạo:</strong>{" "}
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </div>
                    )}

                    {order.fulfillmentType && (
                      <div className="mb-3" style={{ color: "#475569", lineHeight: 1.8 }}>
                        <strong style={{ color: "#0f172a" }}>Hình thức nhận:</strong>{" "}
                        {getFulfillmentText(order.fulfillmentType)}
                      </div>
                    )}

                    <hr />

                    <div className="d-grid gap-2 mb-4" style={{ color: "#334155" }}>
                      <div className="d-flex justify-content-between">
                        <span>Tạm tính</span>
                        <strong>{formatPrice(order.subtotal)}</strong>
                      </div>

                      {order.shippingFee !== undefined && order.shippingFee !== null && (
                        <div className="d-flex justify-content-between">
                          <span>Phí vận chuyển</span>
                          <strong>{formatPrice(order.shippingFee)}</strong>
                        </div>
                      )}

                      <div className="d-flex justify-content-between">
                        <span>Tổng thanh toán</span>
                        <strong>{formatPrice(order.totalAmount)}</strong>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={handleContinuePayment}
                          disabled={actionLoading}
                          style={primaryButton}
                        >
                          <i className="bi bi-credit-card"></i>
                          {actionLoading ? "Đang xử lý..." : "Thanh toán tiếp"}
                        </button>
                      )}

                      {canRepurchase && (
                        <button
                          type="button"
                          onClick={handleBuyAgain}
                          disabled={actionLoading}
                          style={outlineButton}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                          {actionLoading ? "Đang xử lý..." : "Mua lại"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div style={{ ...whiteCard, padding: 24 }}>
                    <h3
                      style={{
                        color: "#0f172a",
                        fontWeight: 800,
                        marginBottom: 20,
                        fontSize: 24,
                      }}
                    >
                      Sản phẩm trong đơn
                    </h3>

                    {(order.items || []).length === 0 ? (
                      <p style={{ color: "#64748b", marginBottom: 0 }}>
                        Không có sản phẩm nào trong đơn hàng này.
                      </p>
                    ) : (
                      <div className="d-grid gap-3">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 18,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div className="row g-3 align-items-center">
                              <div className="col-md-8">
                                <h5
                                  style={{
                                    marginBottom: 8,
                                    color: "#0f172a",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.productName || "Sản phẩm"}
                                </h5>

                                <div style={{ color: "#475569", lineHeight: 1.8 }}>
                                  <div>
                                    <strong style={{ color: "#0f172a" }}>Biến thể:</strong>{" "}
                                    {item.variantName || "Mặc định"}
                                  </div>
                                  <div>
                                    <strong style={{ color: "#0f172a" }}>Số lượng:</strong>{" "}
                                    {item.quantity}
                                  </div>
                                  <div>
                                    <strong style={{ color: "#0f172a" }}>Đơn giá:</strong>{" "}
                                    {formatPrice(item.unitPrice)}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4 text-md-end">
                                <div
                                  style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: "#2563eb",
                                    marginBottom: 12,
                                  }}
                                >
                                  {formatPrice(item.lineTotal)}
                                </div>

                                <div className="d-flex flex-column gap-2 align-items-md-end">
                                  {(isCanceled || isCompleted) && (
                                    <button
                                      type="button"
                                      onClick={() => goToProduct(item)}
                                      style={outlineButton}
                                    >
                                      <i className="bi bi-box-arrow-up-right"></i>
                                      Xem lại sản phẩm
                                    </button>
                                  )}

                                  {canReview && (
                                    <button
                                      type="button"
                                      onClick={() => goToReview(item)}
                                      style={primaryButton}
                                    >
                                      <i className="bi bi-star-fill"></i>
                                      Đánh giá sản phẩm
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}