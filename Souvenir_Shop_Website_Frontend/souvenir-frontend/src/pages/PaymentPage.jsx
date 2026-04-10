import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";

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

  if (s === "pending" || s === "cho_thanh_toan") {
    return { text: "Chờ thanh toán", bg: "#fef3c7", color: "#92400e" };
  }

  if (s === "paid" || s === "success" || s === "da_thanh_toan") {
    return { text: "Đã thanh toán", bg: "#dcfce7", color: "#166534" };
  }

  if (s === "failed" || s === "that_bai") {
    return { text: "Thất bại", bg: "#fee2e2", color: "#991b1b" };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return { text: "Đã hủy", bg: "#e5e7eb", color: "#374151" };
  }

  return { text: "Không xác định", bg: "#e5e7eb", color: "#374151" };
};

const getMethodText = (method) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") return "Thanh toán khi nhận hàng (COD)";
  if (s === "bank_transfer") return "Chuyển khoản ngân hàng";
  if (s === "momo") return "Ví MoMo";
  if (s === "vnpay") return "VNPay";

  return method || "Không xác định";
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

const inputStyle = {
  height: 48,
  borderRadius: 14,
  color: "#111827",
  border: "1px solid #e2e8f0",
  boxShadow: "none",
};

export default function PaymentPage() {
  const { orderCode } = useParams();

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
    } catch {
      setPayment(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErr("");

      try {
        await loadLatest();
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải thông tin thanh toán"));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [orderCode]);

  const create = async () => {
    setErr("");
    setMsg("");

    try {
      setCreating(true);
      const res = await paymentService.create({
        orderCode,
        paymentMethod: method,
      });
      setPayment(res.data);
      setMsg("Tạo thanh toán thành công");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Tạo thanh toán thất bại"));
    } finally {
      setCreating(false);
    }
  };

  const confirm = async () => {
    setErr("");
    setMsg("");

    try {
      setConfirming(true);
      const res = await paymentService.confirm({ orderCode });

      if (typeof res.data === "string") {
        setMsg(res.data);
      } else if (res.data?.message) {
        setMsg(res.data.message);
      } else {
        setMsg("Xác nhận thanh toán thành công");
      }

      await loadLatest();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xác nhận thanh toán thất bại"));
    } finally {
      setConfirming(false);
    }
  };

  const badge = getStatusBadge(payment?.status);

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
              ← Quay lại đơn hàng
            </Link>
          </div>

          <div
            className="text-center mb-5"
            style={{
              paddingTop: 8,
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
              <i className="bi bi-credit-card-2-front-fill"></i>
              Thanh toán đơn hàng
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
              Thanh toán cho đơn hàng: {orderCode}
            </h2>

            <p
              style={{
                maxWidth: 820,
                margin: "0 auto",
                color: "rgba(226,232,240,0.86)",
                lineHeight: 1.9,
                fontSize: 18,
              }}
            >
              Chọn phương thức thanh toán phù hợp và theo dõi trạng thái thanh
              toán của đơn hàng một cách nhanh chóng.
            </p>
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

          {msg && (
            <div
              className="alert mb-4"
              role="alert"
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
                Đang tải thông tin thanh toán...
              </p>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-5">
                <div
                  style={{
                    ...whiteCard,
                    padding: 28,
                  }}
                >
                  <h3
                    style={{
                      color: "#0f172a",
                      fontWeight: 800,
                      marginBottom: 16,
                      fontSize: 24,
                    }}
                  >
                    Thông tin thanh toán
                  </h3>

                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: 16,
                      padding: 16,
                      color: "#475569",
                      lineHeight: 1.9,
                      marginBottom: 20,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#0f172a" }}>Mã đơn hàng:</strong> {orderCode}
                    </div>

                    {payment && (
                      <>
                        <div>
                          <strong style={{ color: "#0f172a" }}>Phương thức:</strong>{" "}
                          {getMethodText(payment.paymentMethod)}
                        </div>
                        <div>
                          <strong style={{ color: "#0f172a" }}>Số tiền:</strong>{" "}
                          {formatPrice(payment.amount)}
                        </div>
                        <div>
                          <strong style={{ color: "#0f172a" }}>Trạng thái:</strong>{" "}
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
                            <strong style={{ color: "#0f172a" }}>Mã giao dịch:</strong>{" "}
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
                      Chọn phương thức thanh toán
                    </label>

                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="form-select"
                      style={inputStyle}
                    >
                      <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="momo">Ví MoMo</option>
                      <option value="vnpay">VNPay</option>
                    </select>
                  </div>

                  <div className="d-grid gap-3">
                    <button
                      onClick={create}
                      className="btn btn-primary"
                      disabled={creating}
                      style={{
                        height: 48,
                        borderRadius: 14,
                        fontWeight: 700,
                        boxShadow: "0 12px 24px rgba(13,110,253,0.18)",
                      }}
                    >
                      {creating ? "Đang tạo thanh toán..." : "Tạo thanh toán"}
                    </button>

                    <button
                      onClick={confirm}
                      className="btn btn-outline-success"
                      disabled={confirming}
                      style={{
                        height: 48,
                        borderRadius: 14,
                        fontWeight: 700,
                      }}
                    >
                      {confirming ? "Đang xác nhận..." : "Xác nhận thanh toán"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div
                  style={{
                    ...whiteCard,
                    padding: 28,
                  }}
                >
                  <h3
                    style={{
                      color: "#0f172a",
                      fontWeight: 800,
                      marginBottom: 16,
                      fontSize: 24,
                    }}
                  >
                    Chi tiết thanh toán
                  </h3>

                  {!payment ? (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 16,
                        padding: 20,
                        color: "#475569",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Chưa có thông tin thanh toán cho đơn hàng này. Hãy chọn
                      phương thức và tạo thanh toán trước.
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 18,
                          padding: 18,
                          background: "#fff",
                        }}
                      >
                        <div style={{ color: "#64748b", marginBottom: 8 }}>
                          Phương thức thanh toán
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {getMethodText(payment.paymentMethod)}
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 18,
                          padding: 18,
                          background: "#fff",
                        }}
                      >
                        <div style={{ color: "#64748b", marginBottom: 8 }}>
                          Trạng thái thanh toán
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
                          borderRadius: 18,
                          padding: 18,
                          background: "#fff",
                        }}
                      >
                        <div style={{ color: "#64748b", marginBottom: 8 }}>
                          Số tiền thanh toán
                        </div>
                        <div
                          style={{
                            color: "#2563eb",
                            fontWeight: 800,
                            fontSize: 24,
                          }}
                        >
                          {formatPrice(payment.amount)}
                        </div>
                      </div>

                      {payment.transactionCode && (
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 18,
                            padding: 18,
                            background: "#fff",
                          }}
                        >
                          <div style={{ color: "#64748b", marginBottom: 8 }}>
                            Mã giao dịch
                          </div>
                          <div
                            style={{
                              color: "#0f172a",
                              fontWeight: 700,
                              wordBreak: "break-word",
                            }}
                          >
                            {payment.transactionCode}
                          </div>
                        </div>
                      )}

                      {payment.paymentUrl && (
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 18,
                            padding: 18,
                            background: "#fff",
                          }}
                        >
                          <div style={{ color: "#64748b", marginBottom: 10 }}>
                            Liên kết thanh toán
                          </div>
                          <a
                            href={payment.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-primary"
                            style={{ borderRadius: 12, fontWeight: 700 }}
                          >
                            Mở trang thanh toán
                          </a>
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