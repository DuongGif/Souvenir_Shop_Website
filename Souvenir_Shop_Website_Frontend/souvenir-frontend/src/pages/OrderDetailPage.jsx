import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { cartService } from "../services/cartService";

/* ================== UI HELPERS ================== */

const formatPrice = (v) => Number(v || 0).toLocaleString("vi-VN") + " ₫";

const getOrderStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") {
    return { text: "Chờ xử lý", color: "#f59e0b", bg: "#fff7ed" };
  }
  if (s === "confirmed") {
    return { text: "Đã xác nhận", color: "#2563eb", bg: "#eff6ff" };
  }
  if (s === "paid") {
    return { text: "Đã thanh toán", color: "#10b981", bg: "#ecfdf5" };
  }
  if (s === "shipping") {
    return { text: "Đang giao hàng", color: "#3b82f6", bg: "#eff6ff" };
  }
  if (s === "completed") {
    return { text: "Hoàn thành", color: "#22c55e", bg: "#ecfdf5" };
  }
  if (s === "cancel_requested" || s === "pending_cancel") {
    return { text: "Chờ duyệt hủy", color: "#9a3412", bg: "#fff7ed" };
  }
  if (s === "return_requested") {
    return { text: "Yêu cầu hoàn hàng", color: "#7c3aed", bg: "#f5f3ff" };
  }
  if (s === "returned") {
    return { text: "Đã hoàn hàng", color: "#5b21b6", bg: "#ede9fe" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { text: "Đã hủy", color: "#ef4444", bg: "#fef2f2" };
  }

  return { text: "Không xác định", color: "#6b7280", bg: "#f3f4f6" };
};

const getOrderTopNotice = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "paid") {
    return {
      icon: "✔",
      text: "Thanh toán thành công",
      color: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    };
  }

  if (s === "cancel_requested" || s === "pending_cancel") {
    return {
      icon: "⏳",
      text: "Đơn hàng đang chờ admin duyệt hủy",
      color: "#9a3412",
      bg: "#fff7ed",
      border: "#fdba74",
    };
  }

  if (s === "cancelled" || s === "canceled") {
    return {
      icon: "✕",
      text: "Đơn hàng đã bị hủy",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (s === "return_requested") {
    return {
      icon: "↩",
      text: "Đã gửi yêu cầu hoàn hàng",
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
    };
  }

  if (s === "returned") {
    return {
      icon: "↺",
      text: "Đơn hàng đã hoàn hàng",
      color: "#5b21b6",
      bg: "#ede9fe",
      border: "#c4b5fd",
    };
  }

  return null;
};

const getPaymentMethodText = (method) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") return "Thanh toán khi nhận hàng";
  if (s === "bank_transfer") return "Chuyển khoản ngân hàng";

  return "Chưa có";
};

const getPaymentStatusText = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return "Chờ thanh toán";
  if (s === "paid") return "Đã thanh toán";
  if (s === "failed") return "Thanh toán thất bại";
  if (s === "expired") return "Đã hết hạn";
  if (s === "refunded") return "Đã hoàn tiền";
  if (s === "cancelled" || s === "canceled") return "Đã hủy";

  return "Chưa có";
};

const getQrImageUrl = (payment) => {
  if (!payment) return "";

  const candidates = [
    payment.qrCodeUrl,
    payment.qrUrl,
    payment.paymentQrUrl,
    payment.vietQrUrl,
    payment.payUrl,
    payment.paymentUrl,
  ].filter(Boolean);

  const isImageLikeUrl = (url) => {
    const u = String(url || "").toLowerCase();
    return (
      u.includes("img.vietqr.io") ||
      u.endsWith(".png") ||
      u.endsWith(".jpg") ||
      u.endsWith(".jpeg") ||
      u.endsWith(".webp") ||
      u.endsWith(".gif") ||
      u.endsWith(".svg")
    );
  };

  return candidates.find(isImageLikeUrl) || "";
};

/* ================== PROGRESS BAR ================== */

const steps = [
  { key: "pending", label: "Chờ xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
];

const getStepIndex = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return 0;
  if (s === "confirmed") return 1;
  if (s === "paid") return 1;
  if (s === "cancel_requested" || s === "pending_cancel") return 1;
  if (s === "shipping") return 2;
  if (s === "completed" || s === "return_requested" || s === "returned") return 3;

  return 0;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const titleStyle = {
  margin: 0,
  color: "#111827",
  fontWeight: 700,
};

const textStyle = {
  color: "#374151",
  lineHeight: 1.8,
};

const subTextStyle = {
  color: "#6b7280",
};

const primaryBtn = {
  background: "#ee4d2d",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};

const secondaryBtn = {
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};

const dangerBtn = {
  background: "#fff",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};

export default function OrderDetailPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [polling, setPolling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  const loadAll = async () => {
    const o = await orderService.byCode(orderCode);
    setOrder(o.data);

    try {
      const p = await paymentService.byOrderCode(orderCode);
      setPayment(p.data);
    } catch {
      setPayment(null);
    }
  };

  useEffect(() => {
    loadAll();
  }, [orderCode]);

  useEffect(() => {
    if (payment?.status === "paid") {
      setShowQr(false);
      loadAll();
      return;
    }

    const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();
    const paymentStatus = String(payment?.status || "").toLowerCase();

    if (paymentMethod === "bank_transfer" && paymentStatus === "pending") {
      setShowQr(true);
    }
  }, [payment]);

  useEffect(() => {
    if (!showQr) return;

    setPolling(true);

    const timer = setInterval(async () => {
      try {
        const p = await paymentService.byOrderCode(orderCode);
        setPayment(p.data);
      } catch {
        // giữ im lặng để tránh nhấp nháy UI
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      setPolling(false);
    };
  }, [showQr, orderCode]);

  const handlePayment = async () => {
    try {
      setErr("");
      setMsg("");
      setActionLoading(true);

      const res = await paymentService.create({
        orderCode,
        paymentMethod: "bank_transfer",
      });

      const createdPayment = res?.data || null;
      setPayment(createdPayment);
      setShowQr(true);
      setMsg("Quét QR để thanh toán");

      try {
        const refreshed = await paymentService.byOrderCode(orderCode);
        if (refreshed?.data) {
          setPayment(refreshed.data);
        }
      } catch {
        // bỏ qua nếu chưa lấy được ngay
      }
    } catch {
      setErr("Không thể tiếp tục thanh toán.");
      setShowQr(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setErr("");
      setMsg("");
      setConfirmingPayment(true);

      await paymentService.confirm({ orderCode });

      const refreshed = await paymentService.byOrderCode(orderCode);
      if (refreshed?.data) {
        setPayment(refreshed.data);
      }

      await loadAll();
      setMsg("Đã xác nhận thanh toán.");
    } catch {
      setErr("Không thể xác nhận thanh toán.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleInstantCancel = async () => {
    const ok = window.confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setCancelLoading(true);

      await orderService.cancelByCode(orderCode);
      await loadAll();
      setShowQr(false);
      setMsg("Đơn hàng đã được hủy.");
    } catch {
      setErr("Không thể hủy đơn hàng.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestCancel = async () => {
    const ok = window.confirm("Gửi yêu cầu hủy đơn cho admin?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setCancelLoading(true);

      await orderService.requestCancel(orderCode);
      await loadAll();
      setMsg("Đã gửi yêu cầu hủy đơn. Vui lòng chờ admin duyệt.");
    } catch {
      setErr("Không thể gửi yêu cầu hủy đơn.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    const ok = window.confirm("Gửi yêu cầu hoàn hàng cho đơn này?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setReturnLoading(true);

      await orderService.requestReturn(orderCode);
      await loadAll();
      setMsg("Đã gửi yêu cầu hoàn hàng.");
    } catch {
      setErr("Không thể gửi yêu cầu hoàn hàng.");
    } finally {
      setReturnLoading(false);
    }
  };

  const handleBuyAgain = async () => {
    try {
      setErr("");
      setActionLoading(true);

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
    } catch {
      setErr("Không thể mua lại đơn hàng này.");
    } finally {
      setActionLoading(false);
    }
  };

  const goToProduct = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy sản phẩm.");
      return;
    }

    navigate(`/products/${item.productId}`);
  };

  const goToReview = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy sản phẩm để đánh giá.");
      return;
    }

    navigate(`/products/${item.productId}?review=1`);
  };

  if (!order) {
    return (
      <MainLayout>
        <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: 30 }}>
          <div className="container">
            <div style={cardStyle}>
              <div style={{ color: "#111827", fontWeight: 700 }}>Đang tải...</div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const badge = getOrderStatusBadge(order.status);
  const topNotice = getOrderTopNotice(order.status);
  const currentStep = getStepIndex(order.status);
  const qrImageUrl = getQrImageUrl(payment);

  const orderStatus = String(order.status || "").toLowerCase();
  const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();
  const paymentStatus = String(payment?.status || "").toLowerCase();

  const isPaid = orderStatus === "paid";
  const isCod = paymentMethod === "cod";
  const isCanceled = orderStatus === "cancelled" || orderStatus === "canceled";
  const isCompleted = orderStatus === "completed";
  const isReturned = orderStatus === "returned";
  const isCancelRequested =
    orderStatus === "cancel_requested" || orderStatus === "pending_cancel";
  const isReturnRequested = orderStatus === "return_requested";

  const showPayButton =
    orderStatus === "pending" && !isCod && !isPaid && !isCancelRequested;

  const canRepurchase = isCanceled || isCompleted || isReturned;
  const canReview = isCompleted;
  const canInstantCancel = orderStatus === "pending";
  const canRequestCancel = ["confirmed", "paid", "shipping"].includes(orderStatus);
  const canRequestReturn = isCompleted && !isReturnRequested && !isReturned;

  const hasQrToShow =
    showQr &&
    paymentMethod === "bank_transfer" &&
    paymentStatus === "pending" &&
    !!qrImageUrl;

  return (
    <MainLayout>
      <div style={{ background: "#f5f5f5", padding: 30, minHeight: "100vh" }}>
        <div className="container">
          {err && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                padding: 12,
                marginBottom: 20,
                borderRadius: 10,
                border: "1px solid #fecaca",
                fontWeight: 600,
              }}
            >
              {err}
            </div>
          )}

          {msg && (
            <div
              style={{
                background: "#ecfdf5",
                color: "#047857",
                padding: 12,
                marginBottom: 20,
                borderRadius: 10,
                border: "1px solid #a7f3d0",
                fontWeight: 600,
              }}
            >
              {msg}
            </div>
          )}

          {topNotice && (
            <>
              <div
                style={{
                  background: topNotice.bg,
                  color: topNotice.color,
                  padding: 12,
                  marginBottom: 20,
                  borderRadius: 10,
                  border: `1px solid ${topNotice.border}`,
                  fontWeight: 700,
                }}
              >
                {topNotice.text}
              </div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, color: topNotice.color, lineHeight: 1 }}>
                  {topNotice.icon}
                </div>
                <div style={{ color: topNotice.color, fontWeight: 700 }}>
                  {topNotice.text}
                </div>
              </div>
            </>
          )}

          <div style={cardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div style={{ ...subTextStyle, marginBottom: 8, fontSize: 14 }}>
                  Mã đơn hàng
                </div>
                <h2 style={{ ...titleStyle, fontSize: "clamp(24px, 4vw, 34px)" }}>
                  {order.orderCode}
                </h2>
              </div>

              <span
                style={{
                  background: badge.bg,
                  color: badge.color,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {badge.text}
              </span>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <div className="row g-3">
              {steps.map((s, i) => {
                const active = i <= currentStep;

                return (
                  <div key={i} className="col-6 col-md-3 text-center">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        margin: "0 auto",
                        borderRadius: "50%",
                        background: active ? "#ee4d2d" : "#d1d5db",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {i + 1}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 14,
                        fontWeight: active ? 700 : 600,
                        color: active ? "#ee4d2d" : "#6b7280",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <h3 style={{ ...titleStyle, marginBottom: 16 }}>Sản phẩm</h3>

            {(order.items || []).length === 0 ? (
              <div style={subTextStyle}>Không có sản phẩm nào.</div>
            ) : (
              <div className="d-grid gap-3">
                {order.items.map((i, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div className="row g-3 align-items-center">
                      <div className="col-md-8">
                        <div
                          style={{
                            color: "#111827",
                            fontWeight: 700,
                            fontSize: 20,
                            marginBottom: 8,
                          }}
                        >
                          {i.productName}
                        </div>

                        <div style={textStyle}>
                          <div>
                            <strong style={{ color: "#111827" }}>Biến thể:</strong>{" "}
                            {i.variantName || "Mặc định"}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>Số lượng:</strong> {i.quantity}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>Đơn giá:</strong>{" "}
                            {formatPrice(i.unitPrice)}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>Thành tiền:</strong>{" "}
                            <span style={{ color: "#ee4d2d", fontWeight: 700 }}>
                              {formatPrice(i.lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4 text-md-end">
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#ee4d2d",
                            marginBottom: 12,
                          }}
                        >
                          {formatPrice(i.lineTotal)}
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {(isCanceled || isCompleted || isReturned) && (
                            <button
                              type="button"
                              onClick={() => goToProduct(i)}
                              style={secondaryBtn}
                            >
                              Xem lại sản phẩm
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => goToReview(i)}
                              style={primaryBtn}
                            >
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

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <h3 style={{ ...titleStyle, marginBottom: 16 }}>Thanh toán</h3>

            <div style={textStyle}>
              <div>
                <strong style={{ color: "#111827" }}>Phương thức:</strong>{" "}
                {getPaymentMethodText(payment?.paymentMethod)}
              </div>
              <div>
                <strong style={{ color: "#111827" }}>Trạng thái:</strong>{" "}
                {getPaymentStatusText(payment?.status)}
              </div>
              <div>
                <strong style={{ color: "#111827" }}>Số tiền:</strong>{" "}
                {formatPrice(payment?.amount || order.totalAmount)}
              </div>
            </div>

            {isCod && (
              <div
                style={{
                  marginTop: 14,
                  background: "#fff7ed",
                  color: "#9a3412",
                  border: "1px solid #fdba74",
                  padding: 12,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                Đơn hàng này dùng phương thức COD nên không cần thanh toán trước.
              </div>
            )}
          </div>

          {showQr && (
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <h3 style={{ ...titleStyle, marginBottom: 16 }}>Quét QR để thanh toán</h3>

              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  width={220}
                  alt="QR thanh toán"
                  style={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    display: "block",
                    marginBottom: 12,
                    maxWidth: "100%",
                  }}
                />
              ) : (
                <div style={subTextStyle}>
                  Chưa có ảnh QR. Backend cần trả về một trong các field như
                  qrCodeUrl, qrUrl, paymentQrUrl, vietQrUrl hoặc paymentUrl là link ảnh QR.
                </div>
              )}

              <div style={textStyle}>
                <strong style={{ color: "#111827" }}>Nội dung chuyển khoản:</strong>{" "}
                {payment?.transactionCode || "Chưa có"}
              </div>

              {polling && (
                <div style={{ ...subTextStyle, marginTop: 10, fontWeight: 600 }}>
                  Đang chờ thanh toán...
                </div>
              )}
            </div>
          )}

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <div
              className="d-flex justify-content-between align-items-center flex-wrap gap-2"
              style={{ color: "#111827", fontWeight: 700, fontSize: 22 }}
            >
              <span>Tổng thanh toán</span>
              <span style={{ color: "#ee4d2d" }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2" style={{ marginTop: 20 }}>
            {showPayButton && !hasQrToShow && (
              <button onClick={handlePayment} style={primaryBtn} disabled={actionLoading}>
                {actionLoading ? "Đang tạo QR..." : "Thanh toán tiếp"}
              </button>
            )}

            {showPayButton && hasQrToShow && (
              <button
                onClick={handleConfirmPayment}
                style={primaryBtn}
                disabled={confirmingPayment}
              >
                {confirmingPayment ? "Đang xác nhận..." : "Xác nhận thanh toán"}
              </button>
            )}

            {canInstantCancel && (
              <button
                onClick={handleInstantCancel}
                style={dangerBtn}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
            )}

            {canRequestCancel && !isCancelRequested && (
              <button
                onClick={handleRequestCancel}
                style={dangerBtn}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Đang gửi yêu cầu..." : "Yêu cầu hủy đơn"}
              </button>
            )}

            {canRequestReturn && (
              <button
                onClick={handleRequestReturn}
                style={secondaryBtn}
                disabled={returnLoading}
              >
                {returnLoading ? "Đang gửi yêu cầu..." : "Hoàn hàng"}
              </button>
            )}

            {canRepurchase && (
              <button onClick={handleBuyAgain} style={secondaryBtn} disabled={actionLoading}>
                Mua lại
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}