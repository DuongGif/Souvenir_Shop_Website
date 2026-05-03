import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { cartService } from "../services/cartService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

/* ================== UI HELPERS ================== */

const formatPrice = (v) => Number(v || 0).toLocaleString("vi-VN") + " ₫";

const getOrderStatusBadge = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") {
    return { text: t.orderStatusPending || "Chờ xử lý", color: "#f59e0b", bg: "#fff7ed" };
  }
  if (s === "confirmed") {
    return { text: t.orderStatusConfirmed || "Đã xác nhận", color: "#2563eb", bg: "#eff6ff" };
  }
  if (s === "paid") {
    return { text: t.orderStatusPaid || "Đã thanh toán", color: "#10b981", bg: "#ecfdf5" };
  }
  if (s === "shipping") {
    return { text: t.orderStatusShipping || "Đang giao hàng", color: "#3b82f6", bg: "#eff6ff" };
  }
  if (s === "completed") {
    return { text: t.orderStatusCompleted || "Hoàn thành", color: "#22c55e", bg: "#ecfdf5" };
  }
  if (s === "cancel_requested" || s === "pending_cancel") {
    return { text: t.orderStatusCancelPending || "Chờ duyệt hủy", color: "#9a3412", bg: "#fff7ed" };
  }
  if (s === "return_requested") {
    return { text: t.orderStatusReturnRequested || "Yêu cầu hoàn hàng", color: "#7c3aed", bg: "#f5f3ff" };
  }
  if (s === "returned") {
    return { text: t.orderStatusReturned || "Đã hoàn hàng", color: "#5b21b6", bg: "#ede9fe" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { text: t.orderStatusCancelled || "Đã hủy", color: "#ef4444", bg: "#fef2f2" };
  }

  return { text: t.orderStatusUnknown || "Không xác định", color: "#6b7280", bg: "#f3f4f6" };
};

const getOrderTopNotice = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "paid") {
    return {
      icon: "✔",
      text: t.orderTopPaid || "Thanh toán thành công",
      color: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    };
  }

  if (s === "cancel_requested" || s === "pending_cancel") {
    return {
      icon: "⏳",
      text: t.orderTopCancelPending || "Đơn hàng đang chờ admin duyệt hủy",
      color: "#9a3412",
      bg: "#fff7ed",
      border: "#fdba74",
    };
  }

  if (s === "cancelled" || s === "canceled") {
    return {
      icon: "✕",
      text: t.orderTopCancelled || "Đơn hàng đã bị hủy",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (s === "return_requested") {
    return {
      icon: "↩",
      text: t.orderTopReturnRequested || "Đã gửi yêu cầu hoàn hàng",
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
    };
  }

  if (s === "returned") {
    return {
      icon: "↺",
      text: t.orderTopReturned || "Đơn hàng đã hoàn hàng",
      color: "#5b21b6",
      bg: "#ede9fe",
      border: "#c4b5fd",
    };
  }

  return null;
};

const getPaymentMethodText = (method, t) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") return t.paymentMethodCod || "Thanh toán khi nhận hàng";
  if (s === "bank_transfer") return t.paymentMethodBankTransfer || "Chuyển khoản ngân hàng";

  return t.notAvailable || "Chưa có";
};

const getPaymentStatusText = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return t.paymentStatusPending || "Chờ thanh toán";
  if (s === "paid") return t.paymentStatusPaid || "Đã thanh toán";
  if (s === "failed") return t.paymentStatusFailedLong || "Thanh toán thất bại";
  if (s === "expired") return t.paymentStatusExpired || "Đã hết hạn";
  if (s === "refunded") return t.paymentStatusRefunded || "Đã hoàn tiền";
  if (s === "cancelled" || s === "canceled") return t.paymentStatusCancelled || "Đã hủy";

  return t.notAvailable || "Chưa có";
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

const getSteps = (t) => [
  { key: "pending", label: t.orderStepPending || "Chờ xử lý" },
  { key: "confirmed", label: t.orderStepConfirmed || "Đã xác nhận" },
  { key: "shipping", label: t.orderStepShipping || "Đang giao" },
  { key: "completed", label: t.orderStepCompleted || "Hoàn thành" },
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
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

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

  const steps = useMemo(() => getSteps(t), [t]);

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
      setMsg(t.scanQrToPay || "Quét QR để thanh toán");

      try {
        const refreshed = await paymentService.byOrderCode(orderCode);
        if (refreshed?.data) {
          setPayment(refreshed.data);
        }
      } catch {
        // bỏ qua nếu chưa lấy được ngay
      }
    } catch {
      setErr(t.cannotContinuePayment || "Không thể tiếp tục thanh toán.");
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
      setMsg(t.paymentConfirmed || "Đã xác nhận thanh toán.");
    } catch {
      setErr(t.cannotConfirmPayment || "Không thể xác nhận thanh toán.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleInstantCancel = async () => {
    const ok = window.confirm(t.confirmCancelOrder || "Bạn có chắc muốn hủy đơn hàng này?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setCancelLoading(true);

      await orderService.cancelByCode(orderCode);
      await loadAll();
      setShowQr(false);
      setMsg(t.orderCancelledSuccess || "Đơn hàng đã được hủy.");
    } catch {
      setErr(t.cannotCancelOrder || "Không thể hủy đơn hàng.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestCancel = async () => {
    const ok = window.confirm(t.confirmRequestCancel || "Gửi yêu cầu hủy đơn cho admin?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setCancelLoading(true);

      await orderService.requestCancel(orderCode);
      await loadAll();
      setMsg(t.cancelRequestSent || "Đã gửi yêu cầu hủy đơn. Vui lòng chờ admin duyệt.");
    } catch {
      setErr(t.cannotRequestCancel || "Không thể gửi yêu cầu hủy đơn.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    const ok = window.confirm(t.confirmRequestReturn || "Gửi yêu cầu hoàn hàng cho đơn này?");
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setReturnLoading(true);

      await orderService.requestReturn(orderCode);
      await loadAll();
      setMsg(t.returnRequestSent || "Đã gửi yêu cầu hoàn hàng.");
    } catch {
      setErr(t.cannotRequestReturn || "Không thể gửi yêu cầu hoàn hàng.");
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
        setErr(
          t.cannotRepurchaseNoVariant ||
            "Không thể mua lại vì đơn hàng chưa có dữ liệu biến thể sản phẩm."
        );
        return;
      }

      navigate("/cart");
    } catch {
      setErr(t.cannotRepurchase || "Không thể mua lại đơn hàng này.");
    } finally {
      setActionLoading(false);
    }
  };

  const goToProduct = (item) => {
    if (!item?.productId) {
      setErr(t.productNotFoundSimple || "Không tìm thấy sản phẩm.");
      return;
    }

    navigate(`/products/${item.productId}`);
  };

  const goToReview = (item) => {
    if (!item?.productId) {
      setErr(t.productNotFoundForReview || "Không tìm thấy sản phẩm để đánh giá.");
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
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {t.loading || "Đang tải..."}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const badge = getOrderStatusBadge(order.status, t);
  const topNotice = getOrderTopNotice(order.status, t);
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
                  {t.orderCodeText || "Mã đơn hàng"}
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
            <h3 style={{ ...titleStyle, marginBottom: 16 }}>
              {t.orderProductsTitle || "Sản phẩm"}
            </h3>

            {(order.items || []).length === 0 ? (
              <div style={subTextStyle}>{t.noProducts || "Không có sản phẩm nào."}</div>
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
                            <strong style={{ color: "#111827" }}>
                              {t.variantLabel || "Biến thể:"}
                            </strong>{" "}
                            {i.variantName || (t.defaultVariant || "Mặc định")}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>
                              {t.quantityLabel || "Số lượng:"}
                            </strong>{" "}
                            {i.quantity}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>
                              {t.unitPriceLabel || "Đơn giá:"}
                            </strong>{" "}
                            {formatPrice(i.unitPrice)}
                          </div>
                          <div>
                            <strong style={{ color: "#111827" }}>
                              {t.lineTotalLabel || "Thành tiền:"}
                            </strong>{" "}
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
                              {t.viewProductAgain || "Xem lại sản phẩm"}
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => goToReview(i)}
                              style={primaryBtn}
                            >
                              {t.reviewProduct || "Đánh giá sản phẩm"}
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
            <h3 style={{ ...titleStyle, marginBottom: 16 }}>
              {t.paymentInfoTitleShort || "Thanh toán"}
            </h3>

            <div style={textStyle}>
              <div>
                <strong style={{ color: "#111827" }}>
                  {t.paymentMethodLabelShort || "Phương thức:"}
                </strong>{" "}
                {getPaymentMethodText(payment?.paymentMethod, t)}
              </div>
              <div>
                <strong style={{ color: "#111827" }}>
                  {t.paymentStatusLabelShort || "Trạng thái:"}
                </strong>{" "}
                {getPaymentStatusText(payment?.status, t)}
              </div>
              <div>
                <strong style={{ color: "#111827" }}>
                  {t.paymentAmountLabelShort || "Số tiền:"}
                </strong>{" "}
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
                {t.codNoPrepayHint ||
                  "Đơn hàng này dùng phương thức COD nên không cần thanh toán trước."}
              </div>
            )}
          </div>

          {showQr && (
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <h3 style={{ ...titleStyle, marginBottom: 16 }}>
                {t.scanQrSectionTitle || "Quét QR để thanh toán"}
              </h3>

              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  width={220}
                  alt={t.paymentQrAlt || "QR thanh toán"}
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
                  {t.qrMissingBackendHint ||
                    "Chưa có ảnh QR. Backend cần trả về một trong các field như qrCodeUrl, qrUrl, paymentQrUrl, vietQrUrl hoặc paymentUrl là link ảnh QR."}
                </div>
              )}

              <div style={textStyle}>
                <strong style={{ color: "#111827" }}>
                  {t.transferContentLabel || "Nội dung chuyển khoản:"}
                </strong>{" "}
                {payment?.transactionCode || (t.notAvailable || "Chưa có")}
              </div>

              {polling && (
                <div style={{ ...subTextStyle, marginTop: 10, fontWeight: 600 }}>
                  {t.waitingForPayment || "Đang chờ thanh toán..."}
                </div>
              )}
            </div>
          )}

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <div
              className="d-flex justify-content-between align-items-center flex-wrap gap-2"
              style={{ color: "#111827", fontWeight: 700, fontSize: 22 }}
            >
              <span>{t.totalPayment || "Tổng thanh toán"}</span>
              <span style={{ color: "#ee4d2d" }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2" style={{ marginTop: 20 }}>
            {showPayButton && !hasQrToShow && (
              <button onClick={handlePayment} style={primaryBtn} disabled={actionLoading}>
                {actionLoading
                  ? (t.creatingQr || "Đang tạo QR...")
                  : (t.continuePayment || "Thanh toán tiếp")}
              </button>
            )}

            {showPayButton && hasQrToShow && (
              <button
                onClick={handleConfirmPayment}
                style={primaryBtn}
                disabled={confirmingPayment}
              >
                {confirmingPayment
                  ? (t.confirmingPayment || "Đang xác nhận...")
                  : (t.confirmPayment || "Xác nhận thanh toán")}
              </button>
            )}

            {canInstantCancel && (
              <button
                onClick={handleInstantCancel}
                style={dangerBtn}
                disabled={cancelLoading}
              >
                {cancelLoading
                  ? (t.cancelling || "Đang hủy...")
                  : (t.cancelOrder || "Hủy đơn hàng")}
              </button>
            )}

            {canRequestCancel && !isCancelRequested && (
              <button
                onClick={handleRequestCancel}
                style={dangerBtn}
                disabled={cancelLoading}
              >
                {cancelLoading
                  ? (t.sendingRequest || "Đang gửi yêu cầu...")
                  : (t.requestCancelOrder || "Yêu cầu hủy đơn")}
              </button>
            )}

            {canRequestReturn && (
              <button
                onClick={handleRequestReturn}
                style={secondaryBtn}
                disabled={returnLoading}
              >
                {returnLoading
                  ? (t.sendingRequest || "Đang gửi yêu cầu...")
                  : (t.returnOrder || "Hoàn hàng")}
              </button>
            )}

            {canRepurchase && (
              <button onClick={handleBuyAgain} style={secondaryBtn} disabled={actionLoading}>
                {t.buyAgain || "Mua lại"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}