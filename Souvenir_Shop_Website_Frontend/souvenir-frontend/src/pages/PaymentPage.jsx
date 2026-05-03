import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 ₫";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
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

const getStatusBadge = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending" || s === "cho_thanh_toan") {
    return {
      text: t.paymentStatusPending || "Chờ thanh toán",
      className: "payment-status-pending",
    };
  }

  if (s === "paid" || s === "success" || s === "da_thanh_toan") {
    return {
      text: t.paymentStatusPaid || "Đã thanh toán",
      className: "payment-status-paid",
    };
  }

  if (s === "failed" || s === "that_bai") {
    return {
      text: t.paymentStatusFailed || "Thất bại",
      className: "payment-status-failed",
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return {
      text: t.paymentStatusCancelled || "Đã hủy",
      className: "payment-status-cancelled",
    };
  }

  return {
    text: t.paymentStatusUnknown || "Không xác định",
    className: "payment-status-unknown",
  };
};

const getMethodText = (method, t) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") {
    return t.paymentMethodCod || "Thanh toán khi nhận hàng (COD)";
  }

  if (s === "bank_transfer") {
    return t.paymentMethodBankTransfer || "Chuyển khoản ngân hàng";
  }

  return method || t.orderUnknown || "Không xác định";
};

const getInlineQrImage = (payment) => {
  return (
    payment?.qrCodeUrl ||
    payment?.qrUrl ||
    payment?.paymentQrUrl ||
    payment?.vietQrUrl ||
    ""
  );
};

const isImageLikeUrl = (url) => {
  if (!url) return false;

  const value = String(url).toLowerCase();

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

export default function PaymentPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [method, setMethod] = useState("cod");
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const paymentMethods = useMemo(
    () => [
      {
        value: "cod",
        title: t.paymentMethodCod || "Thanh toán khi nhận hàng (COD)",
        desc:
          t.paymentMethodCodDesc ||
          "Thanh toán trực tiếp khi nhận sản phẩm.",
        icon: "bi bi-cash-stack",
      },
      {
        value: "bank_transfer",
        title: t.paymentMethodBankTransfer || "Chuyển khoản ngân hàng",
        desc:
          t.paymentMethodBankTransferDesc ||
          "Bấm vào đây để tạo và hiển thị QR ngay trên trang.",
        icon: "bi bi-bank",
      },
    ],
    [t]
  );

  const loadLatest = useCallback(async () => {
    try {
      const res = await paymentService.byOrderCode(orderCode);
      setPayment(res.data);
      return res.data;
    } catch {
      setPayment(null);
      return null;
    }
  }, [orderCode]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErr("");

      try {
        const latest = await loadLatest();

        if (latest?.paymentMethod) {
          setMethod(String(latest.paymentMethod).toLowerCase());
        }
      } catch (ex) {
        setErr(
          getErrorMessage(
            ex,
            t.paymentLoadFailed || "Không thể tải thông tin thanh toán"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadLatest, t.paymentLoadFailed]);

  const goToOrdersSuccess = () => {
    navigate("/orders", {
      state: {
        successMessage:
          t.orderConfirmedSuccess || "Xác nhận đơn hàng thành công.",
      },
    });
  };

  const create = async (forceMethod) => {
    const methodToUse = String(forceMethod || method || "cod").toLowerCase();

    setErr("");
    setMsg("");

    try {
      setCreating(true);

      const res = await paymentService.create({
        orderCode,
        paymentMethod: methodToUse,
      });

      const newPayment = res.data;

      setPayment(newPayment);
      setMethod(methodToUse);

      if (methodToUse === "cod") {
        goToOrdersSuccess();
        return;
      }

      setMsg(
        t.paymentQrCreated ||
          "Đã tạo QR / thông tin chuyển khoản ngay trên trang này."
      );
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.paymentCreateFailed || "Tạo thanh toán thất bại")
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelectMethod = async (value) => {
    setMethod(value);
    setErr("");
    setMsg("");

    if (value !== "bank_transfer") return;

    const currentMethod = String(payment?.paymentMethod || "").toLowerCase();
    const currentStatus = String(payment?.status || "").toLowerCase();

    const canReuseCurrentBankTransfer =
      currentMethod === "bank_transfer" &&
      (currentStatus === "pending" || currentStatus === "paid");

    if (canReuseCurrentBankTransfer) {
      setMsg(
        t.paymentTransferInfoShown ||
          "Đã hiển thị thông tin chuyển khoản cho đơn hàng này."
      );
      return;
    }

    await create("bank_transfer");
  };

  const confirm = async () => {
    setErr("");
    setMsg("");

    try {
      setConfirming(true);

      await paymentService.confirm({ orderCode });
      await loadLatest();

      goToOrdersSuccess();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.paymentConfirmFailed || "Xác nhận thanh toán thất bại"
        )
      );
    } finally {
      setConfirming(false);
    }
  };

  const badge = getStatusBadge(payment?.status, t);

  const selectedMethod = String(method || "").toLowerCase();
  const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();

  const isCod = selectedMethod === "cod";
  const isBankTransfer = selectedMethod === "bank_transfer";

  const inlineQrImage = useMemo(() => {
    return (
      getInlineQrImage(payment) ||
      (isImageLikeUrl(payment?.paymentUrl) ? payment?.paymentUrl : "")
    );
  }, [payment]);

  const canEmbedIframe =
    !inlineQrImage &&
    isBankTransfer &&
    payment?.paymentUrl &&
    String(payment.paymentUrl).startsWith("http") &&
    !isImageLikeUrl(payment?.paymentUrl);

  return (
    <MainLayout>
      <section className="section payment-page-section">
        <div className="container">
          <div className="payment-card payment-header-card">
            <div className="payment-header-top">
              <div>
                <div className="payment-kicker">
                  {t.paymentHeaderSmall || "Thanh toán đơn hàng"}
                </div>

                <h2 className="payment-title">
                  {t.paymentHeaderTitle || "Thanh toán cho đơn hàng"}
                </h2>

                <div className="payment-order-code">{orderCode}</div>
              </div>

              <Link to="/orders" className="payment-back-link">
                {t.backToOrders || "← Quay lại đơn hàng"}
              </Link>
            </div>
          </div>

          {err && (
            <div className="payment-alert payment-alert-error" role="alert">
              {err}
            </div>
          )}

          {msg && (
            <div className="payment-alert payment-alert-success" role="alert">
              {msg}
            </div>
          )}

          {loading ? (
            <div className="payment-card payment-loading-card">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="payment-loading-text">
                {t.paymentLoading || "Đang tải thông tin thanh toán..."}
              </p>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-5">
                <div className="payment-card payment-info-card">
                  <h3 className="payment-section-title">
                    {t.paymentInfoTitle || "Thông tin thanh toán"}
                  </h3>

                  <div className="payment-summary-box">
                    <div>
                      <strong>{t.orderCodeLabel || "Mã đơn hàng:"}</strong>{" "}
                      {orderCode}
                    </div>

                    {payment && (
                      <>
                        <div>
                          <strong>
                            {t.paymentMethodLabel || "Phương thức:"}
                          </strong>{" "}
                          {getMethodText(payment.paymentMethod, t)}
                        </div>

                        <div>
                          <strong>{t.paymentAmountLabel || "Số tiền:"}</strong>{" "}
                          {formatPrice(payment.amount)}
                        </div>

                        <div>
                          <strong>
                            {t.paymentStatusLabel || "Trạng thái:"}
                          </strong>{" "}
                          <span
                            className={`payment-status-badge ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        </div>

                        {payment.transactionCode && (
                          <div>
                            <strong>
                              {t.transactionCodeLabel || "Mã giao dịch:"}
                            </strong>{" "}
                            {payment.transactionCode}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label payment-form-label">
                      {t.choosePaymentMethod || "Chọn phương thức thanh toán"}
                    </label>

                    <div className="payment-method-list">
                      {paymentMethods.map((item) => {
                        const isActive = method === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleSelectMethod(item.value)}
                            disabled={creating}
                            className={`payment-method-button ${
                              isActive ? "active" : ""
                            }`}
                          >
                            <div className="payment-method-icon">
                              <i className={item.icon}></i>
                            </div>

                            <div>
                              <div className="payment-method-title">
                                {item.title}
                              </div>

                              <div className="payment-method-desc">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="payment-action-list">
                    {isCod && (
                      <button
                        type="button"
                        onClick={() => create("cod")}
                        disabled={creating}
                        className="payment-button payment-button-primary"
                      >
                        {creating
                          ? t.processing || "Đang xử lý..."
                          : t.confirmCodOrder || "Xác nhận đơn COD"}
                      </button>
                    )}

                    {isBankTransfer && (
                      <button
                        type="button"
                        onClick={() => create("bank_transfer")}
                        disabled={creating}
                        className="payment-button payment-button-outline-primary"
                      >
                        {creating
                          ? t.creatingQr || "Đang tạo QR..."
                          : t.recreateQr || "Tạo lại QR thanh toán"}
                      </button>
                    )}

                    {isBankTransfer && paymentMethod === "bank_transfer" && (
                      <button
                        type="button"
                        onClick={confirm}
                        disabled={confirming}
                        className="payment-button payment-button-success"
                      >
                        {confirming
                          ? t.confirmingPayment || "Đang xác nhận..."
                          : t.confirmPayment || "Xác nhận thanh toán"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="payment-card payment-detail-card">
                  <h3 className="payment-section-title">
                    {t.paymentDetailTitle || "Chi tiết thanh toán"}
                  </h3>

                  {!payment && !isBankTransfer ? (
                    <div className="payment-empty-box">
                      {t.paymentNoInfo ||
                        "Chưa có thông tin thanh toán cho đơn hàng này. Hãy chọn phương thức thanh toán phù hợp."}
                    </div>
                  ) : (
                    <div className="payment-detail-list">
                      <div className="payment-detail-item">
                        <div className="payment-detail-label">
                          {t.paymentMethodDisplay || "Phương thức thanh toán"}
                        </div>

                        <div className="payment-detail-value">
                          {getMethodText(payment?.paymentMethod || method, t)}
                        </div>
                      </div>

                      {payment && (
                        <>
                          <div className="payment-detail-item">
                            <div className="payment-detail-label">
                              {t.paymentStatusDisplay ||
                                "Trạng thái thanh toán"}
                            </div>

                            <div>
                              <span
                                className={`payment-status-badge large ${badge.className}`}
                              >
                                {badge.text}
                              </span>
                            </div>
                          </div>

                          <div className="payment-detail-item">
                            <div className="payment-detail-label">
                              {t.paymentAmountDisplay || "Số tiền thanh toán"}
                            </div>

                            <div className="payment-amount-value">
                              {formatPrice(payment.amount)}
                            </div>
                          </div>

                          {payment.transactionCode && (
                            <div className="payment-detail-item">
                              <div className="payment-detail-label">
                                {t.paymentTransactionInfo ||
                                  "Mã giao dịch / nội dung chuyển khoản"}
                              </div>

                              <div className="payment-detail-value">
                                {payment.transactionCode}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {isBankTransfer && (
                        <div className="payment-transfer-box">
                          <div className="payment-transfer-title">
                            {t.paymentQrSectionTitle ||
                              "QR / thông tin chuyển khoản ngay trên trang"}
                          </div>

                          {payment?.bankName && (
                            <div className="payment-transfer-line">
                              <strong>{t.bankNameLabel || "Ngân hàng:"}</strong>{" "}
                              {payment.bankName}
                            </div>
                          )}

                          {payment?.accountName && (
                            <div className="payment-transfer-line">
                              <strong>
                                {t.accountNameLabel || "Chủ tài khoản:"}
                              </strong>{" "}
                              {payment.accountName}
                            </div>
                          )}

                          {payment?.accountNo && (
                            <div className="payment-transfer-line">
                              <strong>
                                {t.accountNumberLabel || "Số tài khoản:"}
                              </strong>{" "}
                              {payment.accountNo}
                            </div>
                          )}

                          {payment?.amount !== null &&
                            payment?.amount !== undefined && (
                              <div className="payment-transfer-line last">
                                <strong>{t.paymentAmountLabel || "Số tiền:"}</strong>{" "}
                                {formatPrice(payment.amount)}
                              </div>
                            )}

                          {inlineQrImage ? (
                            <div className="payment-qr-box">
                              <img
                                src={inlineQrImage}
                                alt={t.paymentQrAlt || "QR thanh toán"}
                                className="payment-qr-image"
                              />
                            </div>
                          ) : canEmbedIframe ? (
                            <div className="payment-iframe-box">
                              <iframe
                                src={payment.paymentUrl}
                                title={
                                  t.paymentInfoIframeTitle ||
                                  "Thông tin thanh toán"
                                }
                                className="payment-iframe"
                              />

                              <div className="payment-iframe-hint">
                                {t.paymentIframeHint ||
                                  "Nếu khung không hiển thị được do giới hạn từ phía cổng thanh toán, bạn hãy dùng nút “Tạo lại QR thanh toán”."}
                              </div>
                            </div>
                          ) : (
                            <div className="payment-hint-box">
                              {paymentMethod === "bank_transfer"
                                ? t.paymentQrMissingHint ||
                                  "Đã tạo thanh toán chuyển khoản. Nếu backend của bạn chưa trả về ảnh QR, hãy hiển thị thêm qrCodeUrl hoặc qrUrl từ API để QR hiện trực tiếp tại đây."
                                : t.paymentSelectBankHint ||
                                  "Hãy bấm vào “Chuyển khoản ngân hàng” ở bên trái để tạo QR ngay trên trang này."}
                            </div>
                          )}
                        </div>
                      )}

                      {isCod && (
                        <div className="payment-cod-box">
                          {t.paymentCodHint ||
                            "Đơn hàng này sử dụng hình thức thanh toán khi nhận hàng (COD), nên không cần xác nhận thanh toán trước."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}