import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";

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
    return { text: "Chờ xử lý", bg: "#fef3c7", color: "#92400e" };
  }
  if (s === "paid") {
    return { text: "Đã thanh toán", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "shipping") {
    return { text: "Đang giao", bg: "#dbeafe", color: "#1d4ed8" };
  }
  if (s === "completed") {
    return { text: "Hoàn thành", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { text: "Đã hủy", bg: "#fee2e2", color: "#991b1b" };
  }

  return { text: status || "Không xác định", bg: "#e5e7eb", color: "#374151" };
};

export default function OrderDetailPage() {
  const { orderCode } = useParams();

  const [o, setO] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await orderService.byCode(orderCode);
        setO(res.data);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải chi tiết đơn hàng"));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderCode]);

  const badge = getStatusBadge(o?.status);

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
              ← Quay lại danh sách đơn hàng
            </Link>
          </div>

          {err && (
            <div className="alert alert-danger" role="alert">
              {err}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải chi tiết đơn hàng...</p>
            </div>
          ) : !o ? (
            <div className="alert alert-warning">Không tìm thấy đơn hàng.</div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-4">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 24,
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
                    Thông tin đơn hàng
                  </h3>

                  <div className="mb-3">
                    <div style={{ color: "#64748b", marginBottom: 6 }}>
                      Mã đơn hàng
                    </div>
                    <div
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: 20,
                      }}
                    >
                      {o.orderCode}
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
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {o.createdAt && (
                    <div className="mb-3" style={{ color: "#475569" }}>
                      <strong>Ngày tạo:</strong>{" "}
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </div>
                  )}

                  {o.fulfillmentType && (
                    <div className="mb-3" style={{ color: "#475569" }}>
                      <strong>Hình thức nhận:</strong> {o.fulfillmentType}
                    </div>
                  )}

                  <hr />

                  <div className="d-grid gap-2" style={{ color: "#334155" }}>
                    <div className="d-flex justify-content-between">
                      <span>Tạm tính</span>
                      <strong>{formatPrice(o.subtotal)}</strong>
                    </div>

                    <div className="d-flex justify-content-between">
                      <span>Tổng thanh toán</span>
                      <strong>{formatPrice(o.totalAmount)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h3
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Sản phẩm trong đơn
                  </h3>

                  {(o.items || []).length === 0 ? (
                    <p style={{ color: "#64748b", marginBottom: 0 }}>
                      Không có sản phẩm nào trong đơn hàng này.
                    </p>
                  ) : (
                    <div className="d-grid gap-3">
                      {(o.items || []).map((it, idx) => (
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
                                {it.productName || "Sản phẩm"}
                              </h5>

                              <div style={{ color: "#475569", lineHeight: 1.8 }}>
                                <div>
                                  <strong>Biến thể:</strong>{" "}
                                  {it.variantName || "Mặc định"}
                                </div>
                                <div>
                                  <strong>Số lượng:</strong> {it.quantity}
                                </div>
                                <div>
                                  <strong>Đơn giá:</strong>{" "}
                                  {formatPrice(it.unitPrice)}
                                </div>
                              </div>
                            </div>

                            <div className="col-md-4 text-md-end">
                              <div
                                style={{
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: "#2563eb",
                                }}
                              >
                                {formatPrice(it.lineTotal)}
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
          )}
        </div>
      </section>
    </MainLayout>
  );
}