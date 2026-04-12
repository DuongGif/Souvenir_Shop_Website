import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    return { text: "Chờ xử lý", bg: "#fff7ed", color: "#c2410c" };
  }

  if (s === "confirmed" || s === "da_xac_nhan") {
    return { text: "Đã xác nhận", bg: "#eff6ff", color: "#1d4ed8" };
  }

  if (s === "paid" || s === "da_thanh_toan") {
    return { text: "Đã thanh toán", bg: "#ecfdf5", color: "#047857" };
  }

  if (s === "shipping" || s === "dang_giao") {
    return { text: "Đang giao hàng", bg: "#eff6ff", color: "#1d4ed8" };
  }

  if (s === "completed" || s === "hoan_thanh") {
    return { text: "Hoàn thành", bg: "#ecfdf5", color: "#047857" };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return { text: "Đã hủy", bg: "#fef2f2", color: "#b91c1c" };
  }

  return {
    text: "Không xác định",
    bg: "#f3f4f6",
    color: "#374151",
  };
};

const getFulfillmentText = (value) => {
  const s = String(value || "").toLowerCase();

  if (s === "delivery" || s === "giao_hang") return "Giao hàng tận nơi";
  if (s === "pickup" || s === "nhan_tai_diem") return "Nhận tại điểm";
  if (s === "hotel" || s === "hotel_delivery" || s === "giao_khach_san") {
    return "Giao tại khách sạn";
  }

  return value || "Không xác định";
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

const matchesFilter = (status, filterKey) => {
  const s = normalizeStatus(status);

  if (filterKey === "all") return true;
  if (filterKey === "pending") {
    return s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan";
  }
  if (filterKey === "confirmed") {
    return s === "confirmed" || s === "da_xac_nhan" || s === "paid" || s === "da_thanh_toan";
  }
  if (filterKey === "shipping") {
    return s === "shipping" || s === "dang_giao";
  }
  if (filterKey === "completed") {
    return s === "completed" || s === "hoan_thanh";
  }
  if (filterKey === "cancelled") {
    return s === "cancelled" || s === "canceled" || s === "da_huy";
  }

  return true;
};

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const filterTabs = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setMsg(location.state.successMessage);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location, navigate]);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await orderService.my();
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải danh sách đơn hàng."));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => matchesFilter(order.status, activeTab));
  }, [orders, activeTab]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => matchesFilter(o.status, "pending")).length,
      confirmed: orders.filter((o) => matchesFilter(o.status, "confirmed")).length,
      shipping: orders.filter((o) => matchesFilter(o.status, "shipping")).length,
      completed: orders.filter((o) => matchesFilter(o.status, "completed")).length,
      cancelled: orders.filter((o) => matchesFilter(o.status, "cancelled")).length,
    };
  }, [orders]);

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
                  }}
                >
                  Quản lý đơn hàng
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  Đơn mua của tôi
                </h2>
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                Tổng số đơn: <span style={{ color: "#ee4d2d" }}>{orders.length}</span>
              </div>
            </div>
          </div>

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

          <div
            style={{
              ...pageCard,
              padding: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {filterTabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: isActive ? "#ee4d2d" : "#fff",
                      color: isActive ? "#fff" : "#374151",
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "10px 16px",
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 8px 18px rgba(238,77,45,0.2)" : "none",
                      borderColor: "#e5e7eb",
                    }}
                  >
                    {tab.label} ({counts[tab.key] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ ...pageCard, padding: 40 }} className="text-center">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                Đang tải danh sách đơn hàng...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ ...pageCard, padding: 40 }} className="text-center">
              <div
                style={{
                  fontSize: 54,
                  color: "#d1d5db",
                  marginBottom: 12,
                }}
              >
                <i className="bi bi-bag-x"></i>
              </div>

              <h4 style={{ color: "#111827", fontWeight: 700 }}>
                Không có đơn hàng phù hợp
              </h4>

              <p style={{ color: "#6b7280", marginBottom: 20 }}>
                Không có đơn hàng nào trong mục{" "}
                <strong>{filterTabs.find((x) => x.key === activeTab)?.label}</strong>.
              </p>

              <Link
                to="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ee4d2d",
                  color: "#fff",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <i className="bi bi-bag"></i>
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);

                return (
                  <div
                    key={order.id || order.orderCode}
                    style={{
                      ...pageCard,
                      padding: 20,
                    }}
                  >
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              color: "#111827",
                              fontWeight: 800,
                              fontSize: 20,
                            }}
                          >
                            {order.orderCode}
                          </h4>

                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>

                        <div style={{ color: "#4b5563", lineHeight: 1.9 }}>
                          {order.createdAt && (
                            <div>
                              <strong style={{ color: "#111827" }}>Ngày tạo:</strong>{" "}
                              {new Date(order.createdAt).toLocaleString("vi-VN")}
                            </div>
                          )}

                          {order.fulfillmentType && (
                            <div>
                              <strong style={{ color: "#111827" }}>Hình thức nhận:</strong>{" "}
                              {getFulfillmentText(order.fulfillmentType)}
                            </div>
                          )}

                          <div>
                            <strong style={{ color: "#111827" }}>Tạm tính:</strong>{" "}
                            {formatPrice(order.subtotal)}
                          </div>

                          {order.shippingFee !== undefined &&
                            order.shippingFee !== null && (
                              <div>
                                <strong style={{ color: "#111827" }}>Phí vận chuyển:</strong>{" "}
                                {formatPrice(order.shippingFee)}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="text-md-end" style={{ minWidth: 220 }}>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 14,
                            marginBottom: 8,
                          }}
                        >
                          Tổng thanh toán
                        </div>

                        <div
                          style={{
                            color: "#ee4d2d",
                            fontSize: 26,
                            fontWeight: 800,
                            marginBottom: 14,
                          }}
                        >
                          {formatPrice(order.totalAmount)}
                        </div>

                        <Link
                          to={`/orders/${order.orderCode}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "1px solid #ee4d2d",
                            background: "#fff",
                            color: "#ee4d2d",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          <i className="bi bi-eye"></i>
                          Xem chi tiết
                        </Link>
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