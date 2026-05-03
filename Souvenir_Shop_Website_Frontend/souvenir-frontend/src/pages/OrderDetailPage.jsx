import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { cartService } from "../services/cartService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const formatPrice = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

const getOrderStatusBadge = (status, t) => {
  const s = normalizeStatus(status);

  if (s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan") {
    return {
      text: t.orderStatusPending || "Chờ xử lý",
      className: "order-detail-status-pending",
    };
  }

  if (s === "confirmed" || s === "da_xac_nhan") {
    return {
      text: t.orderStatusConfirmed || "Đã xác nhận",
      className: "order-detail-status-confirmed",
    };
  }

  if (s === "paid" || s === "da_thanh_toan") {
    return {
      text: t.orderStatusPaid || "Đã thanh toán",
      className: "order-detail-status-paid",
    };
  }

  if (s === "shipping" || s === "dang_giao") {
    return {
      text: t.orderStatusShipping || "Đang giao hàng",
      className: "order-detail-status-shipping",
    };
  }

  if (s === "completed" || s === "hoan_thanh") {
    return {
      text: t.orderStatusCompleted || "Hoàn thành",
      className: "order-detail-status-completed",
    };
  }

  if (
    s === "cancel_requested" ||
    s === "pending_cancel" ||
    s === "yeu_cau_huy" ||
    s === "dang_yeu_cau_huy"
  ) {
    return {
      text: t.orderStatusCancelRequested || "Đang yêu cầu hủy đơn",
      className: "order-detail-status-cancel-requested",
    };
  }

  if (s === "return_requested" || s === "yeu_cau_hoan_hang") {
    return {
      text: t.orderStatusReturnRequested || "Yêu cầu hoàn hàng",
      className: "order-detail-status-return-requested",
    };
  }

  if (s === "returned" || s === "da_hoan_hang") {
    return {
      text: t.orderStatusReturned || "Đã hoàn hàng",
      className: "order-detail-status-returned",
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return {
      text: t.orderStatusCancelled || "Đã hủy",
      className: "order-detail-status-cancelled",
    };
  }

  return {
    text: t.orderStatusUnknown || "Không xác định",
    className: "order-detail-status-unknown",
  };
};

const getOrderTopNotice = (status, t) => {
  const s = normalizeStatus(status);

  if (s === "paid" || s === "da_thanh_toan") {
    return {
      icon: "✓",
      text: t.orderTopPaid || "Thanh toán thành công",
      alertClass: "order-detail-alert-success",
      colorClass: "success",
    };
  }

  if (
    s === "cancel_requested" ||
    s === "pending_cancel" ||
    s === "yeu_cau_huy" ||
    s === "dang_yeu_cau_huy"
  ) {
    return {
      icon: "⏳",
      text:
        t.orderTopCancelPending ||
        "Đơn hàng đang chờ admin duyệt yêu cầu hủy",
      alertClass: "order-detail-alert-warning",
      colorClass: "warning",
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return {
      icon: "✕",
      text: t.orderTopCancelled || "Đơn hàng đã bị hủy",
      alertClass: "order-detail-alert-error",
      colorClass: "danger",
    };
  }

  if (s === "return_requested" || s === "yeu_cau_hoan_hang") {
    return {
      icon: "↩",
      text: t.orderTopReturnRequested || "Đã gửi yêu cầu hoàn hàng",
      alertClass: "order-detail-alert-purple",
      colorClass: "purple",
    };
  }

  if (s === "returned" || s === "da_hoan_hang") {
    return {
      icon: "↺",
      text: t.orderTopReturned || "Đơn hàng đã hoàn hàng",
      alertClass: "order-detail-alert-purple-dark",
      colorClass: "purple-dark",
    };
  }

  return null;
};

const getPaymentMethodText = (method, t) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") return t.paymentMethodCod || "Thanh toán khi nhận hàng";

  if (s === "bank_transfer") {
    return t.paymentMethodBankTransfer || "Chuyển khoản ngân hàng";
  }

  return t.notAvailable || "Chưa có";
};

const getPaymentStatusText = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return t.paymentStatusPending || "Chờ thanh toán";
  if (s === "paid") return t.paymentStatusPaid || "Đã thanh toán";
  if (s === "failed") return t.paymentStatusFailedLong || "Thanh toán thất bại";
  if (s === "expired") return t.paymentStatusExpired || "Đã hết hạn";
  if (s === "refunded") return t.paymentStatusRefunded || "Đã hoàn tiền";

  if (s === "cancelled" || s === "canceled") {
    return t.paymentStatusCancelled || "Đã hủy";
  }

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
    const value = String(url || "").toLowerCase();

    return (
      value.includes("img.vietqr.io") ||
      value.endsWith(".png") ||
      value.endsWith(".jpg") ||
      value.endsWith(".jpeg") ||
      value.endsWith(".webp") ||
      value.endsWith(".gif") ||
      value.endsWith(".svg")
    );
  };

  return candidates.find(isImageLikeUrl) || "";
};

const getSteps = (t) => [
  { key: "pending", label: t.orderStepPending || "Chờ xử lý" },
  { key: "confirmed", label: t.orderStepConfirmed || "Đã xác nhận" },
  { key: "shipping", label: t.orderStepShipping || "Đang giao" },
  { key: "completed", label: t.orderStepCompleted || "Hoàn thành" },
];

const getStepIndex = (status) => {
  const s = normalizeStatus(status);

  if (s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan") return 0;

  if (
    s === "confirmed" ||
    s === "da_xac_nhan" ||
    s === "paid" ||
    s === "da_thanh_toan" ||
    s === "cancel_requested" ||
    s === "pending_cancel" ||
    s === "yeu_cau_huy" ||
    s === "dang_yeu_cau_huy"
  ) {
    return 1;
  }

  if (s === "shipping" || s === "dang_giao") return 2;

  if (
    s === "completed" ||
    s === "hoan_thanh" ||
    s === "return_requested" ||
    s === "yeu_cau_hoan_hang" ||
    s === "returned" ||
    s === "da_hoan_hang"
  ) {
    return 3;
  }

  return 0;
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

  const loadAll = useCallback(async () => {
    const orderRes = await orderService.byCode(orderCode);
    setOrder(orderRes.data);

    try {
      const paymentRes = await paymentService.byOrderCode(orderCode);
      setPayment(paymentRes.data);
    } catch {
      setPayment(null);
    }
  }, [orderCode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();
    const paymentStatus = String(payment?.status || "").toLowerCase();

    if (paymentStatus === "paid") {
      setShowQr(false);
      loadAll();
      return;
    }

    if (paymentMethod === "bank_transfer" && paymentStatus === "pending") {
      setShowQr(true);
    }
  }, [payment, loadAll]);

  useEffect(() => {
    if (!showQr) return;

    setPolling(true);

    const timer = setInterval(async () => {
      try {
        const paymentRes = await paymentService.byOrderCode(orderCode);
        setPayment(paymentRes.data);
      } catch {
        // Không hiển thị lỗi để tránh nhấp nháy giao diện.
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

      setPayment(res?.data || null);
      setShowQr(true);
      setMsg(t.scanQrToPay || "Quét QR để thanh toán");

      try {
        const refreshed = await paymentService.byOrderCode(orderCode);
        if (refreshed?.data) {
          setPayment(refreshed.data);
        }
      } catch {
        // Bỏ qua nếu backend chưa trả thanh toán mới ngay lập tức.
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
    const ok = window.confirm(
      t.confirmCancelOrder || "Bạn có chắc muốn hủy đơn hàng này?"
    );

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
    const ok = window.confirm(
      t.confirmRequestCancel || "Gửi yêu cầu hủy đơn cho admin?"
    );

    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setCancelLoading(true);

      await orderService.requestCancel(orderCode);
      await loadAll();

      setMsg(
        t.cancelRequestSent ||
          "Đã gửi yêu cầu hủy đơn. Vui lòng chờ admin duyệt."
      );
    } catch {
      setErr(t.cannotRequestCancel || "Không thể gửi yêu cầu hủy đơn.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    const ok = window.confirm(
      t.confirmRequestReturn || "Gửi yêu cầu hoàn hàng cho đơn này?"
    );

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
      setErr(
        t.productNotFoundForReview || "Không tìm thấy sản phẩm để đánh giá."
      );
      return;
    }

    navigate(`/products/${item.productId}?review=1`);
  };

  if (!order) {
    return (
      <MainLayout>
        <div className="order-detail-page">
          <div className="container">
            <div className="order-detail-card">
              <div className="order-detail-title">
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

  const orderStatus = normalizeStatus(order.status);
  const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();
  const paymentStatus = String(payment?.status || "").toLowerCase();

  const isPaid = orderStatus === "paid" || orderStatus === "da_thanh_toan";
  const isCod = paymentMethod === "cod";

  const isCanceled =
    orderStatus === "cancelled" ||
    orderStatus === "canceled" ||
    orderStatus === "da_huy";

  const isCompleted =
    orderStatus === "completed" || orderStatus === "hoan_thanh";

  const isReturned =
    orderStatus === "returned" || orderStatus === "da_hoan_hang";

  const isCancelRequested =
    orderStatus === "cancel_requested" ||
    orderStatus === "pending_cancel" ||
    orderStatus === "yeu_cau_huy" ||
    orderStatus === "dang_yeu_cau_huy";

  const isReturnRequested =
    orderStatus === "return_requested" || orderStatus === "yeu_cau_hoan_hang";

  const showPayButton =
    (orderStatus === "pending" ||
      orderStatus === "cho_xu_ly" ||
      orderStatus === "cho_xac_nhan") &&
    !isCod &&
    !isPaid &&
    !isCancelRequested;

  const canRepurchase = isCanceled || isCompleted || isReturned;
  const canReview = isCompleted;

  const canInstantCancel =
    orderStatus === "pending" ||
    orderStatus === "cho_xu_ly" ||
    orderStatus === "cho_xac_nhan";

  const canRequestCancel = [
    "confirmed",
    "da_xac_nhan",
    "paid",
    "da_thanh_toan",
    "shipping",
    "dang_giao",
  ].includes(orderStatus);

  const canRequestReturn = isCompleted && !isReturnRequested && !isReturned;

  const hasQrToShow =
    showQr &&
    paymentMethod === "bank_transfer" &&
    paymentStatus === "pending" &&
    !!qrImageUrl;

  return (
    <MainLayout>
      <div className="order-detail-page">
        <div className="container">
          {err && (
            <div className="order-detail-alert order-detail-alert-error">
              {err}
            </div>
          )}

          {msg && (
            <div className="order-detail-alert order-detail-alert-success">
              {msg}
            </div>
          )}

          {topNotice && (
            <>
              <div className={`order-detail-alert ${topNotice.alertClass}`}>
                {topNotice.text}
              </div>

              <div className="order-detail-top-icon-wrap">
                <div
                  className={`order-detail-top-icon ${topNotice.colorClass}`}
                >
                  {topNotice.icon}
                </div>

                <div
                  className={`order-detail-top-text ${topNotice.colorClass}`}
                >
                  {topNotice.text}
                </div>
              </div>
            </>
          )}

          <div className="order-detail-card">
            <div className="order-detail-header">
              <div>
                <div className="order-detail-kicker">
                  {t.orderCodeText || "Mã đơn hàng"}
                </div>

                <h2 className="order-detail-title">{order.orderCode}</h2>
              </div>

              <span
                className={`order-detail-status-badge ${badge.className}`}
              >
                {badge.text}
              </span>
            </div>
          </div>

          <div className="order-detail-card">
            <div className="row g-3">
              {steps.map((step, index) => {
                const active = index <= currentStep;

                return (
                  <div key={step.key} className="col-6 col-md-3">
                    <div className="order-detail-step">
                      <div
                        className={`order-detail-step-circle ${
                          active ? "active" : ""
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div
                        className={`order-detail-step-label ${
                          active ? "active" : ""
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-detail-card">
            <h3 className="order-detail-section-title">
              {t.orderProductsTitle || "Sản phẩm"}
            </h3>

            {(order.items || []).length === 0 ? (
              <div className="order-detail-sub-text">
                {t.noProducts || "Không có sản phẩm nào."}
              </div>
            ) : (
              <div className="order-detail-products-list">
                {order.items.map((item, index) => (
                  <div key={index} className="order-detail-product-item">
                    <div className="row g-3 align-items-center">
                      <div className="col-md-8">
                        <div className="order-detail-product-name">
                          {item.productName}
                        </div>

                        <div className="order-detail-text">
                          <div>
                            <strong>{t.variantLabel || "Biến thể:"}</strong>{" "}
                            {item.variantName || t.defaultVariant || "Mặc định"}
                          </div>

                          <div>
                            <strong>{t.quantityLabel || "Số lượng:"}</strong>{" "}
                            {item.quantity}
                          </div>

                          <div>
                            <strong>{t.unitPriceLabel || "Đơn giá:"}</strong>{" "}
                            {formatPrice(item.unitPrice)}
                          </div>

                          <div>
                            <strong>{t.lineTotalLabel || "Thành tiền:"}</strong>{" "}
                            <span className="order-detail-line-total">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4 text-md-end">
                        <div className="order-detail-product-price">
                          {formatPrice(item.lineTotal)}
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {(isCanceled || isCompleted || isReturned) && (
                            <button
                              type="button"
                              onClick={() => goToProduct(item)}
                              className="order-detail-btn order-detail-btn-secondary"
                            >
                              {t.viewProductAgain || "Xem lại sản phẩm"}
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => goToReview(item)}
                              className="order-detail-btn order-detail-btn-primary"
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

          <div className="order-detail-card">
            <h3 className="order-detail-section-title">
              {t.paymentInfoTitleShort || "Thanh toán"}
            </h3>

            <div className="order-detail-text">
              <div>
                <strong>{t.paymentMethodLabelShort || "Phương thức:"}</strong>{" "}
                {getPaymentMethodText(payment?.paymentMethod, t)}
              </div>

              <div>
                <strong>{t.paymentStatusLabelShort || "Trạng thái:"}</strong>{" "}
                {getPaymentStatusText(payment?.status, t)}
              </div>

              <div>
                <strong>{t.paymentAmountLabelShort || "Số tiền:"}</strong>{" "}
                {formatPrice(payment?.amount || order.totalAmount)}
              </div>
            </div>

            {isCod && (
              <div className="order-detail-alert order-detail-alert-warning order-detail-cod-note">
                {t.codNoPrepayHint ||
                  "Đơn hàng này dùng phương thức COD nên không cần thanh toán trước."}
              </div>
            )}
          </div>

          {showQr && (
            <div className="order-detail-card">
              <h3 className="order-detail-section-title">
                {t.scanQrSectionTitle || "Quét QR để thanh toán"}
              </h3>

              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={t.paymentQrAlt || "QR thanh toán"}
                  className="order-detail-qr-image"
                />
              ) : (
                <div className="order-detail-sub-text">
                  {t.qrMissingBackendHint ||
                    "Chưa có ảnh QR. Backend cần trả về một trong các field như qrCodeUrl, qrUrl, paymentQrUrl, vietQrUrl hoặc paymentUrl là link ảnh QR."}
                </div>
              )}

              <div className="order-detail-text">
                <strong>{t.transferContentLabel || "Nội dung chuyển khoản:"}</strong>{" "}
                {payment?.transactionCode || t.notAvailable || "Chưa có"}
              </div>

              {polling && (
                <div className="order-detail-waiting">
                  {t.waitingForPayment || "Đang chờ thanh toán..."}
                </div>
              )}
            </div>
          )}

          <div className="order-detail-card">
            <div className="order-detail-total-box">
              <span>{t.totalPayment || "Tổng thanh toán"}</span>
              <span className="order-detail-total-price">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="order-detail-actions">
            {showPayButton && !hasQrToShow && (
              <button
                onClick={handlePayment}
                disabled={actionLoading}
                className="order-detail-btn order-detail-btn-primary"
              >
                {actionLoading
                  ? t.creatingQr || "Đang tạo QR..."
                  : t.continuePayment || "Thanh toán tiếp"}
              </button>
            )}

            {showPayButton && hasQrToShow && (
              <button
                onClick={handleConfirmPayment}
                disabled={confirmingPayment}
                className="order-detail-btn order-detail-btn-primary"
              >
                {confirmingPayment
                  ? t.confirmingPayment || "Đang xác nhận..."
                  : t.confirmPayment || "Xác nhận thanh toán"}
              </button>
            )}

            {canInstantCancel && (
              <button
                onClick={handleInstantCancel}
                disabled={cancelLoading}
                className="order-detail-btn order-detail-btn-danger"
              >
                {cancelLoading
                  ? t.cancelling || "Đang hủy..."
                  : t.cancelOrder || "Hủy đơn hàng"}
              </button>
            )}

            {canRequestCancel && !isCancelRequested && (
              <button
                onClick={handleRequestCancel}
                disabled={cancelLoading}
                className="order-detail-btn order-detail-btn-danger"
              >
                {cancelLoading
                  ? t.sendingRequest || "Đang gửi yêu cầu..."
                  : t.requestCancelOrder || "Yêu cầu hủy đơn"}
              </button>
            )}

            {canRequestReturn && (
              <button
                onClick={handleRequestReturn}
                disabled={returnLoading}
                className="order-detail-btn order-detail-btn-secondary"
              >
                {returnLoading
                  ? t.sendingRequest || "Đang gửi yêu cầu..."
                  : t.returnOrder || "Hoàn hàng"}
              </button>
            )}

            {canRepurchase && (
              <button
                onClick={handleBuyAgain}
                disabled={actionLoading}
                className="order-detail-btn order-detail-btn-secondary"
              >
                {t.buyAgain || "Mua lại"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}