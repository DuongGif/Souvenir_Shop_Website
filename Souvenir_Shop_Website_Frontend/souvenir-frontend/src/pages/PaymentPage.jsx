import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

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

const getStatusBadge = (status, t) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending" || s === "cho_thanh_toan") {
    return {
      text: t.paymentStatusPending || "Chờ thanh toán",
      bg: "#fef3c7",
      color: "#92400e",
    };
  }

  if (s === "paid" || s === "success" || s === "da_thanh_toan") {
    return {
      text: t.paymentStatusPaid || "Đã thanh toán",
      bg: "#dcfce7",
      color: "#166534",
    };
  }

  if (s === "failed" || s === "that_bai") {
    return {
      text: t.paymentStatusFailed || "Thất bại",
      bg: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return {
      text: t.paymentStatusCancelled || "Đã hủy",
      bg: "#e5e7eb",
      color: "#374151",
    };
  }

  return {
    text: t.paymentStatusUnknown || "Không xác định",
    bg: "#e5e7eb",
    color: "#374151",
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

  return method || (t.orderUnknown || "Không xác định");
};

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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

  const u = String(url).toLowerCase();

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

  const loadLatest = async () => {
    try {
      const res = await paymentService.byOrderCode(orderCode);
      setPayment(res.data);
      return res.data;
    } catch {
      setPayment(null);
      return null;
    }
  };

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
  }, [orderCode, t.paymentLoadFailed]);

  const goToOrdersSuccess = () => {
    navigate("/orders", {
      state: {
        successMessage:
          t.orderConfirmedSuccess || "Xác nhận đơn hàng thành công.",
      },
    });
  };

  const create = async (forceMethod) => {
    const methodToUse = (forceMethod || method || "cod").toLowerCase();

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
        getErrorMessage(
          ex,
          t.paymentCreateFailed || "Tạo thanh toán thất bại"
        )
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
      <section
        className="section"
        style={{
          background: "#f5f5f5",
          minHeight: "100vh",
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <div className="container">
          <div
            style={{
              ...pageCard,
              padding: 24,
              marginBottom: 20,
              borderLeft: "5px solid #ee4d2d",
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  {t.paymentHeaderSmall || "Thanh toán đơn hàng"}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                    lineHeight: 1.3,
                  }}
                >
                  {t.paymentHeaderTitle || "Thanh toán cho đơn hàng"}
                </h2>

                <div
                  style={{
                    marginTop: 10,
                    color: "#ee4d2d",
                    fontWeight: 700,
                    wordBreak: "break-word",
                  }}
                >
                  {orderCode}
                </div>
              </div>

              <Link
                to="/orders"
                style={{
                  color: "#ee4d2d",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {t.backToOrders || "← Quay lại đơn hàng"}
              </Link>
            </div>
          </div>

          {err && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 12,
              }}
            >
              {err}
            </div>
          )}

          {msg && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
              }}
            >
              {msg}
            </div>
          )}

          {loading ? (
            <div style={{ ...pageCard, padding: 40 }} className="text-center">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                {t.paymentLoading || "Đang tải thông tin thanh toán..."}
              </p>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-5">
                <div style={{ ...pageCard, padding: 24 }}>
                  <h3
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                      marginBottom: 18,
                      fontSize: 28,
                    }}
                  >
                    {t.paymentInfoTitle || "Thông tin thanh toán"}
                  </h3>

                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                      color: "#4b5563",
                      lineHeight: 1.9,
                      marginBottom: 20,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#111827" }}>
                        {t.orderCodeLabel || "Mã đơn hàng:"}
                      </strong>{" "}
                      {orderCode}
                    </div>

                    {payment && (
                      <>
                        <div>
                          <strong style={{ color: "#111827" }}>
                            {t.paymentMethodLabel || "Phương thức:"}
                          </strong>{" "}
                          {getMethodText(payment.paymentMethod, t)}
                        </div>
                        <div>
                          <strong style={{ color: "#111827" }}>
                            {t.paymentAmountLabel || "Số tiền:"}
                          </strong>{" "}
                          {formatPrice(payment.amount)}
                        </div>
                        <div>
                          <strong style={{ color: "#111827" }}>
                            {t.paymentStatusLabel || "Trạng thái:"}
                          </strong>{" "}
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 700,
                              marginLeft: 6,
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>
                        {payment.transactionCode && (
                          <div>
                            <strong style={{ color: "#111827" }}>
                              {t.transactionCodeLabel || "Mã giao dịch:"}
                            </strong>{" "}
                            {payment.transactionCode}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#111827", fontWeight: 700 }}
                    >
                      {t.choosePaymentMethod || "Chọn phương thức thanh toán"}
                    </label>

                    <div className="d-grid gap-2">
                      {[
                        {
                          value: "cod",
                          title:
                            t.paymentMethodCod ||
                            "Thanh toán khi nhận hàng (COD)",
                          desc:
                            t.paymentMethodCodDesc ||
                            "Thanh toán trực tiếp khi nhận sản phẩm.",
                          icon: "bi bi-cash-stack",
                        },
                        {
                          value: "bank_transfer",
                          title:
                            t.paymentMethodBankTransfer ||
                            "Chuyển khoản ngân hàng",
                          desc:
                            t.paymentMethodBankTransferDesc ||
                            "Bấm vào đây để tạo và hiển thị QR ngay trên trang.",
                          icon: "bi bi-bank",
                        },
                      ].map((item) => {
                        const isActive = method === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleSelectMethod(item.value)}
                            disabled={creating}
                            style={{
                              border: "none",
                              outline: "none",
                              background: isActive ? "#fff1ee" : "#fff",
                              color: "#111827",
                              borderRadius: 14,
                              padding: "14px 16px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              boxShadow: isActive
                                ? "inset 0 0 0 2px #ee4d2d"
                                : "inset 0 0 0 1px #e5e7eb",
                              opacity:
                                creating && item.value === "bank_transfer"
                                  ? 0.8
                                  : 1,
                            }}
                          >
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isActive ? "#ee4d2d" : "#fff7ed",
                                color: isActive ? "#fff" : "#ee4d2d",
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            >
                              <i className={item.icon}></i>
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#111827",
                                  marginBottom: 4,
                                }}
                              >
                                {item.title}
                              </div>
                              <div
                                style={{
                                  color: "#6b7280",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                }}
                              >
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="d-grid gap-3 mt-4">
                    {isCod && (
                      <button
                        onClick={() => create("cod")}
                        disabled={creating}
                        style={{
                          height: 46,
                          borderRadius: 10,
                          fontWeight: 700,
                          background: "#ee4d2d",
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        {creating
                          ? t.processing || "Đang xử lý..."
                          : t.confirmCodOrder || "Xác nhận đơn COD"}
                      </button>
                    )}

                    {isBankTransfer && (
                      <button
                        onClick={() => create("bank_transfer")}
                        disabled={creating}
                        style={{
                          height: 46,
                          borderRadius: 10,
                          fontWeight: 700,
                          background: "#fff",
                          color: "#ee4d2d",
                          border: "1px solid #ee4d2d",
                        }}
                      >
                        {creating
                          ? t.creatingQr || "Đang tạo QR..."
                          : t.recreateQr || "Tạo lại QR thanh toán"}
                      </button>
                    )}

                    {isBankTransfer && paymentMethod === "bank_transfer" && (
                      <button
                        onClick={confirm}
                        disabled={confirming}
                        style={{
                          height: 46,
                          borderRadius: 10,
                          fontWeight: 700,
                          background: "#fff",
                          color: "#166534",
                          border: "1px solid #86efac",
                        }}
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
                <div style={{ ...pageCard, padding: 24 }}>
                  <h3
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                      marginBottom: 18,
                      fontSize: 28,
                    }}
                  >
                    {t.paymentDetailTitle || "Chi tiết thanh toán"}
                  </h3>

                  {!payment && !isBankTransfer ? (
                    <div
                      style={{
                        background: "#fafafa",
                        borderRadius: 14,
                        padding: 20,
                        color: "#4b5563",
                        border: "1px solid #e5e7eb",
                        lineHeight: 1.8,
                      }}
                    >
                      {t.paymentNoInfo ||
                        "Chưa có thông tin thanh toán cho đơn hàng này. Hãy chọn phương thức thanh toán phù hợp."}
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 16,
                          padding: 18,
                          background: "#fff",
                        }}
                      >
                        <div style={{ color: "#6b7280", marginBottom: 8 }}>
                          {t.paymentMethodDisplay || "Phương thức thanh toán"}
                        </div>
                        <div style={{ color: "#111827", fontWeight: 700 }}>
                          {getMethodText(payment?.paymentMethod || method, t)}
                        </div>
                      </div>

                      {payment && (
                        <>
                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 16,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div style={{ color: "#6b7280", marginBottom: 8 }}>
                              {t.paymentStatusDisplay || "Trạng thái thanh toán"}
                            </div>
                            <div>
                              <span
                                style={{
                                  background: badge.bg,
                                  color: badge.color,
                                  padding: "6px 12px",
                                  borderRadius: 999,
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                {badge.text}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 16,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div style={{ color: "#6b7280", marginBottom: 8 }}>
                              {t.paymentAmountDisplay || "Số tiền thanh toán"}
                            </div>
                            <div
                              style={{
                                color: "#ee4d2d",
                                fontWeight: 700,
                                fontSize: 28,
                              }}
                            >
                              {formatPrice(payment.amount)}
                            </div>
                          </div>

                          {payment.transactionCode && (
                            <div
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 16,
                                padding: 18,
                                background: "#fff",
                              }}
                            >
                              <div style={{ color: "#6b7280", marginBottom: 8 }}>
                                {t.paymentTransactionInfo ||
                                  "Mã giao dịch / nội dung chuyển khoản"}
                              </div>
                              <div
                                style={{
                                  color: "#111827",
                                  fontWeight: 700,
                                  wordBreak: "break-word",
                                }}
                              >
                                {payment.transactionCode}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {isBankTransfer && (
                        <div
                          style={{
                            border: "1px solid #fed7aa",
                            borderRadius: 16,
                            padding: 18,
                            background: "#fff7ed",
                          }}
                        >
                          <div
                            style={{
                              color: "#c2410c",
                              fontWeight: 700,
                              marginBottom: 12,
                              fontSize: 16,
                            }}
                          >
                            {t.paymentQrSectionTitle ||
                              "QR / thông tin chuyển khoản ngay trên trang"}
                          </div>

                          {payment?.bankName && (
                            <div style={{ color: "#7c2d12", marginBottom: 6 }}>
                              <strong>{t.bankNameLabel || "Ngân hàng:"}</strong>{" "}
                              {payment.bankName}
                            </div>
                          )}

                          {payment?.accountName && (
                            <div style={{ color: "#7c2d12", marginBottom: 6 }}>
                              <strong>
                                {t.accountNameLabel || "Chủ tài khoản:"}
                              </strong>{" "}
                              {payment.accountName}
                            </div>
                          )}

                          {payment?.accountNo && (
                            <div style={{ color: "#7c2d12", marginBottom: 6 }}>
                              <strong>
                                {t.accountNumberLabel || "Số tài khoản:"}
                              </strong>{" "}
                              {payment.accountNo}
                            </div>
                          )}

                          {payment?.amount !== null &&
                            payment?.amount !== undefined && (
                              <div style={{ color: "#7c2d12", marginBottom: 10 }}>
                                <strong>{t.paymentAmountLabel || "Số tiền:"}</strong>{" "}
                                {formatPrice(payment.amount)}
                              </div>
                            )}

                          {inlineQrImage ? (
                            <div
                              style={{
                                marginTop: 12,
                                background: "#fff",
                                borderRadius: 14,
                                padding: 16,
                                border: "1px solid #fed7aa",
                                textAlign: "center",
                              }}
                            >
                              <img
                                src={inlineQrImage}
                                alt={t.paymentQrAlt || "QR thanh toán"}
                                style={{
                                  width: "100%",
                                  maxWidth: 320,
                                  borderRadius: 12,
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            </div>
                          ) : canEmbedIframe ? (
                            <div
                              style={{
                                marginTop: 12,
                                background: "#fff",
                                borderRadius: 14,
                                padding: 12,
                                border: "1px solid #fed7aa",
                              }}
                            >
                              <iframe
                                src={payment.paymentUrl}
                                title={t.paymentInfoIframeTitle || "Thông tin thanh toán"}
                                style={{
                                  width: "100%",
                                  minHeight: 420,
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 12,
                                  background: "#fff",
                                }}
                              />
                              <div
                                style={{
                                  marginTop: 10,
                                  color: "#7c2d12",
                                  fontSize: 13,
                                  lineHeight: 1.6,
                                }}
                              >
                                {t.paymentIframeHint ||
                                  "Nếu khung không hiển thị được do giới hạn từ phía cổng thanh toán, bạn hãy dùng nút “Tạo lại QR thanh toán”."}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                marginTop: 12,
                                background: "#fff",
                                borderRadius: 14,
                                padding: 16,
                                border: "1px solid #fed7aa",
                                color: "#7c2d12",
                                lineHeight: 1.8,
                              }}
                            >
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
                        <div
                          style={{
                            border: "1px solid #fed7aa",
                            borderRadius: 16,
                            padding: 18,
                            background: "#fff7ed",
                            color: "#92400e",
                            lineHeight: 1.8,
                          }}
                        >
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