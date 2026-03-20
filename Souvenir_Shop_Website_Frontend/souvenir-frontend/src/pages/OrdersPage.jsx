import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await orderService.my();
        setOrders(res.data || []);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải danh sách đơn hàng"));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <MainLayout>
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="section-title">
            <h2>Đơn hàng của tôi</h2>
            <p>
              Theo dõi danh sách đơn hàng, trạng thái xử lý và xem chi tiết từng
              đơn đã đặt.
            </p>
          </div>

          {err && (
            <div className="alert alert-danger" role="alert">
              {err}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
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
                Bạn chưa có đơn hàng nào
              </h4>
              <p style={{ color: "#64748b" }}>
                Hãy khám phá các sản phẩm lưu niệm và tạo đơn hàng đầu tiên của bạn.
              </p>
              <Link
                to="/products"
                className="btn btn-primary"
                style={{ borderRadius: 12, padding: "10px 22px" }}
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {orders.map((o) => {
                const badge = getStatusBadge(o.status);

                return (
                  <div
                    key={o.orderCode}
                    style={{
                      background: "#fff",
                      borderRadius: 24,
                      padding: 24,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="row g-3 align-items-center">
                      <div className="col-lg-7">
                        <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
                          <h4
                            style={{
                              marginBottom: 0,
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            {o.orderCode}
                          </h4>

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

                        <div style={{ color: "#475569", lineHeight: 1.8 }}>
                          <div>
                            <strong>Tổng tiền:</strong> {formatPrice(o.totalAmount)}
                          </div>
                          {o.createdAt && (
                            <div>
                              <strong>Ngày tạo:</strong>{" "}
                              {new Date(o.createdAt).toLocaleString("vi-VN")}
                            </div>
                          )}
                          {o.fulfillmentType && (
                            <div>
                              <strong>Hình thức nhận:</strong> {o.fulfillmentType}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-lg-5">
                        <div className="d-flex justify-content-lg-end flex-wrap gap-2">
                          <Link
                            to={`/orders/${o.orderCode}`}
                            className="btn btn-primary"
                            style={{
                              borderRadius: 12,
                              minWidth: 160,
                              height: 46,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                            }}
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}