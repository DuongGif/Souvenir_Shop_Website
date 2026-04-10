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
  if (s === "hotel_delivery" || s === "giao_khach_san") return "Giao tại khách sạn";

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
          <div
            className="text-center mb-5"
            style={{
              paddingTop: 18,
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
              <i className="bi bi-receipt-cutoff"></i>
              Đơn hàng của tôi
            </span>

            <h2
              style={{
                fontWeight: 800,
                marginBottom: 18,
                color: "#f8fafc",
                fontSize: "clamp(32px, 5vw, 54px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Theo dõi đơn hàng của bạn
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
              Xem danh sách đơn hàng, trạng thái xử lý, thời gian tạo đơn và truy
              cập chi tiết từng đơn một cách nhanh chóng.
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
                Đang tải danh sách đơn hàng...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                ...whiteCard,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: "50%",
                  margin: "0 auto 18px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(13,110,253,0.10)",
                  color: "#0d6efd",
                  fontSize: 30,
                }}
              >
                <i className="bi bi-bag-x"></i>
              </div>

              <h4 style={{ color: "#0f172a", fontWeight: 800 }}>
                Bạn chưa có đơn hàng nào
              </h4>
              <p style={{ color: "#64748b", marginBottom: 20 }}>
                Hãy khám phá các sản phẩm lưu niệm và tạo đơn hàng đầu tiên của bạn.
              </p>
              <Link
                to="/products"
                className="btn btn-primary"
                style={{ borderRadius: 14, padding: "11px 24px", fontWeight: 700 }}
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
                      ...whiteCard,
                      padding: 24,
                    }}
                  >
                    <div className="row g-3 align-items-center">
                      <div className="col-lg-8">
                        <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                          <h4
                            style={{
                              marginBottom: 0,
                              color: "#0f172a",
                              fontWeight: 800,
                              fontSize: 22,
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                            }}
                          >
                            Đơn hàng: {o.orderCode}
                          </h4>

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

                        <div
                          style={{
                            color: "#475569",
                            lineHeight: 1.9,
                            fontSize: 15,
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>Tổng tiền:</strong>{" "}
                            {formatPrice(o.totalAmount)}
                          </div>

                          {o.createdAt && (
                            <div>
                              <strong style={{ color: "#0f172a" }}>Ngày tạo:</strong>{" "}
                              {new Date(o.createdAt).toLocaleString("vi-VN")}
                            </div>
                          )}

                          {o.fulfillmentType && (
                            <div>
                              <strong style={{ color: "#0f172a" }}>
                                Hình thức nhận:
                              </strong>{" "}
                              {getFulfillmentText(o.fulfillmentType)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-lg-4">
                        <div className="d-flex justify-content-lg-end flex-wrap gap-2">
                          <Link
                            to={`/orders/${o.orderCode}`}
                            className="btn btn-primary"
                            style={{
                              borderRadius: 14,
                              minWidth: 170,
                              height: 48,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              boxShadow: "0 12px 24px rgba(13,110,253,0.18)",
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