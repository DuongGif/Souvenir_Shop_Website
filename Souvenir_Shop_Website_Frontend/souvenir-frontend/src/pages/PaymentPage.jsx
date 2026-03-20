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

  if (s === "pending") {
    return { text: "Chờ thanh toán", bg: "#fef3c7", color: "#92400e" };
  }
  if (s === "paid" || s === "success") {
    return { text: "Đã thanh toán", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "failed") {
    return { text: "Thất bại", bg: "#fee2e2", color: "#991b1b" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { text: "Đã hủy", bg: "#e5e7eb", color: "#374151" };
  }

  return { text: status || "Không xác định", bg: "#e5e7eb", color: "#374151" };
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
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="mb-4">
            <Link
              to="/orders"
              style={{
                color: "#93c5fd",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← Quay lại đơn hàng
            </Link>
          </div>

          <div className="section-title">
            <h2>Thanh toán đơn hàng</h2>
            <p>
              Chọn phương thức thanh toán và theo dõi trạng thái thanh toán cho
              đơn hàng của bạn.
            </p>
          </div>

          {err && (
            <div className="alert alert-danger" role="alert">
              {err}
            </div>
          )}

          {msg && (
            <div className="alert alert-success" role="alert">
              {msg}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải thông tin thanh toán...</p>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-5">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h3
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    Thông tin đơn thanh toán
                  </h3>

                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: 16,
                      padding: 16,
                      color: "#475569",
                      lineHeight: 1.8,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <strong>Mã đơn hàng:</strong> {orderCode}
                    </div>

                    {payment && (
                      <>
                        <div>
                          <strong>Phương thức:</strong> {payment.paymentMethod}
                        </div>
                        <div>
                          <strong>Số tiền:</strong> {formatPrice(payment.amount)}
                        </div>
                        <div>
                          <strong>Trạng thái:</strong>{" "}
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 600,
                              marginLeft: 6,
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>
                        {payment.transactionCode && (
                          <div>
                            <strong>Mã giao dịch:</strong> {payment.transactionCode}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#111827", fontWeight: 600 }}
                    >
                      Phương thức thanh toán
                    </label>

                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="form-select"
                      style={{
                        height: 48,
                        borderRadius: 12,
                        color: "#111827",
                      }}
                    >
                      <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="momo">MoMo (mock)</option>
                      <option value="vnpay">VNPay (mock)</option>
                    </select>
                  </div>

                  <div className="d-grid gap-3">
                    <button
                      onClick={create}
                      className="btn btn-primary"
                      disabled={creating}
                      style={{
                        height: 48,
                        borderRadius: 12,
                        fontWeight: 600,
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
                        borderRadius: 12,
                        fontWeight: 600,
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
                    background: "#fff",
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h3
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      marginBottom: 16,
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
                      }}
                    >
                      Chưa có thông tin thanh toán cho đơn hàng này. Hãy chọn phương
                      thức và tạo thanh toán trước.
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
                          Phương thức
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {payment.paymentMethod}
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
                          Trạng thái
                        </div>
                        <div>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 600,
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
                            fontWeight: 700,
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
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
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
                          <div style={{ color: "#64748b", marginBottom: 8 }}>
                            Liên kết thanh toán
                          </div>
                          <a
                            href={payment.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-primary"
                            style={{ borderRadius: 12 }}
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