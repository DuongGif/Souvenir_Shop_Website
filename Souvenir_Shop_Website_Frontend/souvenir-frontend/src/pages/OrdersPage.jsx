import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
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

  if (s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan") {
    return {
      text: t.orderStatusPending || "Chờ xử lý",
      className: "orders-status-pending",
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
      className: "orders-status-cancel-requested",
    };
  }

  if (s === "confirmed" || s === "da_xac_nhan") {
    return {
      text: t.orderStatusConfirmed || "Đã xác nhận",
      className: "orders-status-confirmed",
    };
  }

  if (s === "paid" || s === "da_thanh_toan") {
    return {
      text: t.orderStatusPaid || "Đã thanh toán",
      className: "orders-status-paid",
    };
  }

  if (s === "shipping" || s === "dang_giao") {
    return {
      text: t.orderStatusShipping || "Đang giao hàng",
      className: "orders-status-shipping",
    };
  }

  if (s === "completed" || s === "hoan_thanh") {
    return {
      text: t.orderStatusCompleted || "Hoàn thành",
      className: "orders-status-completed",
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return {
      text: t.orderStatusCancelled || "Đã hủy",
      className: "orders-status-cancelled",
    };
  }

  return {
    text: t.orderStatusUnknown || "Không xác định",
    className: "orders-status-unknown",
  };
};

const getFulfillmentText = (value, t) => {
  const s = String(value || "").toLowerCase();

  if (s === "delivery" || s === "giao_hang") {
    return t.fulfillmentDelivery || "Giao hàng tận nơi";
  }

  if (s === "pickup" || s === "nhan_tai_diem") {
    return t.fulfillmentPickup || "Nhận tại điểm";
  }

  if (s === "hotel" || s === "hotel_delivery" || s === "giao_khach_san") {
    return t.fulfillmentHotel || "Giao tại khách sạn";
  }

  return value || t.orderUnknown || "Không xác định";
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

const matchesFilter = (status, filterKey) => {
  const s = normalizeStatus(status);

  if (filterKey === "all") return true;

  if (filterKey === "pending") {
    return s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan";
  }

  if (filterKey === "confirmed") {
    return (
      s === "confirmed" ||
      s === "da_xac_nhan" ||
      s === "paid" ||
      s === "da_thanh_toan" ||
      s === "cancel_requested" ||
      s === "pending_cancel" ||
      s === "yeu_cau_huy" ||
      s === "dang_yeu_cau_huy"
    );
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

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const filterTabs = useMemo(
    () => [
      { key: "all", label: t.orderTabAll || "Tất cả" },
      { key: "pending", label: t.orderTabPending || "Chờ xử lý" },
      { key: "confirmed", label: t.orderTabConfirmed || "Đã xác nhận" },
      { key: "shipping", label: t.orderTabShipping || "Đang giao" },
      { key: "completed", label: t.orderTabCompleted || "Hoàn thành" },
      { key: "cancelled", label: t.orderTabCancelled || "Đã hủy" },
    ],
    [t]
  );

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!location.state?.successMessage) return;

    setMsg(location.state.successMessage);

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await orderService.my();
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (ex) {
        setErr(
          getErrorMessage(
            ex,
            t.ordersLoadFailed || "Không thể tải danh sách đơn hàng."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [t.ordersLoadFailed]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => matchesFilter(order.status, activeTab));
  }, [orders, activeTab]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((order) => matchesFilter(order.status, "pending"))
        .length,
      confirmed: orders.filter((order) =>
        matchesFilter(order.status, "confirmed")
      ).length,
      shipping: orders.filter((order) => matchesFilter(order.status, "shipping"))
        .length,
      completed: orders.filter((order) =>
        matchesFilter(order.status, "completed")
      ).length,
      cancelled: orders.filter((order) =>
        matchesFilter(order.status, "cancelled")
      ).length,
    };
  }, [orders]);

  const activeTabLabel =
    filterTabs.find((tab) => tab.key === activeTab)?.label ||
    t.orderTabAll ||
    "Tất cả";

  return (
    <MainLayout>
      <section className="section orders-page-section">
        <div className="container">
          <div className="orders-card orders-header-card">
            <div className="orders-header-top">
              <div>
                <div className="orders-kicker">
                  {t.ordersHeaderSmall || "Quản lý đơn hàng"}
                </div>

                <h2 className="orders-title">
                  {t.ordersHeaderTitle || "Đơn mua của tôi"}
                </h2>
              </div>

              <div className="orders-total">
                {t.ordersTotal || "Tổng số đơn:"} <span>{orders.length}</span>
              </div>
            </div>
          </div>

          {msg && (
            <div className="orders-alert orders-alert-success" role="alert">
              {msg}
            </div>
          )}

          {err && (
            <div className="orders-alert orders-alert-error" role="alert">
              {err}
            </div>
          )}

          <div className="orders-card orders-tabs-card">
            <div className="orders-tabs-list">
              {filterTabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`orders-tab-button ${isActive ? "active" : ""}`}
                  >
                    {tab.label} ({counts[tab.key] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="orders-card orders-loading-card">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="orders-loading-text">
                {t.ordersLoading || "Đang tải danh sách đơn hàng..."}
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-card orders-empty-card">
              <div className="orders-empty-icon">
                <i className="bi bi-bag-x"></i>
              </div>

              <h4 className="orders-empty-title">
                {t.ordersEmptyTitle || "Không có đơn hàng phù hợp"}
              </h4>

              <p className="orders-empty-text">
                {t.ordersEmptyDescPrefix || "Không có đơn hàng nào trong mục"}{" "}
                <strong>{activeTabLabel}</strong>.
              </p>

              <Link to="/products" className="orders-main-button">
                <i className="bi bi-bag"></i>
                {t.shopNow || "Mua sắm ngay"}
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status, t);

                return (
                  <div
                    key={order.id || order.orderCode}
                    className="orders-card orders-item-card"
                  >
                    <div className="orders-item-layout">
                      <div className="orders-item-info">
                        <div className="orders-code-row">
                          <h4 className="orders-code">{order.orderCode}</h4>

                          <span
                            className={`orders-status-badge ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        </div>

                        <div className="orders-meta">
                          {order.createdAt && (
                            <div>
                              <strong>
                                {t.orderCreatedDate || "Ngày tạo:"}
                              </strong>{" "}
                              {new Date(order.createdAt).toLocaleString(
                                "vi-VN"
                              )}
                            </div>
                          )}

                          {order.fulfillmentType && (
                            <div>
                              <strong>
                                {t.orderFulfillmentType || "Hình thức nhận:"}
                              </strong>{" "}
                              {getFulfillmentText(order.fulfillmentType, t)}
                            </div>
                          )}

                          <div>
                            <strong>{t.subtotal || "Tạm tính:"}</strong>{" "}
                            {formatPrice(order.subtotal)}
                          </div>

                          {order.shippingFee !== undefined &&
                            order.shippingFee !== null && (
                              <div>
                                <strong>
                                  {t.shippingFee || "Phí vận chuyển:"}
                                </strong>{" "}
                                {formatPrice(order.shippingFee)}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="orders-payment-box">
                        <div className="orders-payment-label">
                          {t.totalPayment || "Tổng thanh toán"}
                        </div>

                        <div className="orders-payment-amount">
                          {formatPrice(order.totalAmount)}
                        </div>

                        <Link
                          to={`/orders/${order.orderCode}`}
                          className="orders-detail-button"
                        >
                          <i className="bi bi-eye"></i>
                          {t.viewDetails || "Xem chi tiết"}
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