import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { adminOrdersService } from "../../services/admin/adminOrdersService";

const PAGE_SIZE = 5;

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

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "0 ₫";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
};

const formatPriceShort = (value) => {
  if (!value) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeStatus = (status) => {
  const value = String(status || "").trim().toLowerCase();

  if (
    value === "dang_giao" ||
    value === "đang giao" ||
    value === "da_giao_van" ||
    value === "shipped"
  ) {
    return "shipping";
  }

  if (value === "canceled") return "cancelled";
  if (value === "pending_cancel") return "cancel_requested";
  if (value === "cho_duyet_huy") return "cancel_requested";
  if (value === "yeu_cau_huy") return "cancel_requested";
  if (value === "yeu_cau_hoan_hang") return "return_requested";
  if (value === "da_hoan_hang") return "returned";

  return value || "pending";
};

const getStatusText = (status) => {
  const value = normalizeStatus(status);

  if (value === "pending") return "Chờ xử lý";
  if (value === "confirmed") return "Đã xác nhận";
  if (value === "paid") return "Đã thanh toán";
  if (value === "shipping") return "Đang giao hàng";
  if (value === "completed") return "Hoàn thành";
  if (value === "cancel_requested") return "Chờ duyệt hủy";
  if (value === "return_requested") return "Yêu cầu hoàn hàng";
  if (value === "returned") return "Đã hoàn hàng";
  if (value === "cancelled") return "Đã hủy";

  return status || "Không xác định";
};

const getStatusBadge = (status) => {
  const value = normalizeStatus(status);

  if (value === "pending") return { text: "Chờ xử lý", className: "pending" };
  if (value === "confirmed") return { text: "Đã xác nhận", className: "confirmed" };
  if (value === "paid") return { text: "Đã thanh toán", className: "paid" };
  if (value === "shipping") return { text: "Đang giao hàng", className: "shipping" };
  if (value === "completed") return { text: "Hoàn thành", className: "completed" };
  if (value === "cancel_requested") return { text: "Chờ duyệt hủy", className: "cancel-requested" };
  if (value === "return_requested") return { text: "Yêu cầu hoàn hàng", className: "return-requested" };
  if (value === "returned") return { text: "Đã hoàn hàng", className: "returned" };
  if (value === "cancelled") return { text: "Đã hủy", className: "cancelled" };

  return { text: getStatusText(status), className: "unknown" };
};

const isPlacedOrder = (order) => {
  const status = normalizeStatus(order?.status);
  return status !== "cancelled" && status !== "returned";
};

const isDeliveredOrder = (order) => {
  const status = normalizeStatus(order?.status);
  return status === "completed";
};

const isPendingDeliveryOrder = (order) => {
  return isPlacedOrder(order) && !isDeliveredOrder(order);
};

const sumRevenue = (items) => {
  return items.reduce((sum, item) => {
    return sum + Number(item?.totalAmount || 0);
  }, 0);
};

const isInDateRange = (dateValue, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (date < from) return false;
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59`);
    if (date > to) return false;
  }

  return true;
};

// Nhóm đơn hàng theo ngày để vẽ biểu đồ
const groupByDate = (orders) => {
  const map = {};

  orders.forEach((order) => {
    if (!order?.createdAt) return;

    const date = new Date(order.createdAt);
    if (Number.isNaN(date.getTime())) return;

    const key = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });

    if (!map[key]) {
      map[key] = { date: key, revenue: 0, count: 0 };
    }

    map[key].revenue += Number(order.totalAmount || 0);
    map[key].count += 1;
  });

  return Object.values(map).sort((a, b) => {
    const [da, ma] = a.date.split("/").map(Number);
    const [db, mb] = b.date.split("/").map(Number);
    return ma !== mb ? ma - mb : da - db;
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#374151" }}>
        Ngày {label}
      </div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          {item.name}:{" "}
          {item.dataKey === "revenue"
            ? formatPrice(item.value)
            : `${item.value} đơn`}
        </div>
      ))}
    </div>
  );
};

const IconTable = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}>
    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5 0v4h6V2H5zm6 5H5v4h6V7zm1 4V7h3v4h-3zm-1 1H5v3h6v-3zM4 15v-3H1v2a1 1 0 0 0 1 1h2zm3-9h6V2H7v4z" />
  </svg>
);

const IconBar = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}>
    <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z" />
  </svg>
);

const IconLine = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}>
    <path fillRule="evenodd" d="M0 0h1v15h15v1H0V0Zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07Z" />
  </svg>
);

export default function AdminFinancePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState("placed");
  const [currentPage, setCurrentPage] = useState(1);

  // "table" | "bar" | "line"
  const [viewMode, setViewMode] = useState("table");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminOrdersService.getAll();
      setOrders(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải dữ liệu báo cáo tài chính"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, fromDate, toDate, tab]);

  const reportOrders = useMemo(() => {
    return orders.filter((order) => {
      return isInDateRange(order?.createdAt, fromDate, toDate);
    });
  }, [orders, fromDate, toDate]);

  const placedOrders = useMemo(() => reportOrders.filter(isPlacedOrder), [reportOrders]);
  const deliveredOrders = useMemo(() => reportOrders.filter(isDeliveredOrder), [reportOrders]);
  const pendingDeliveryOrders = useMemo(() => reportOrders.filter(isPendingDeliveryOrder), [reportOrders]);

  const placedRevenue = useMemo(() => sumRevenue(placedOrders), [placedOrders]);
  const deliveredRevenue = useMemo(() => sumRevenue(deliveredOrders), [deliveredOrders]);
  const pendingDeliveryRevenue = useMemo(() => sumRevenue(pendingDeliveryOrders), [pendingDeliveryOrders]);

  const completionRate = useMemo(() => {
    if (placedOrders.length === 0) return 0;
    return Math.round((deliveredOrders.length / placedOrders.length) * 100);
  }, [placedOrders.length, deliveredOrders.length]);

  const detailSource = useMemo(() => {
    if (tab === "delivered") return deliveredOrders;
    if (tab === "pending") return pendingDeliveryOrders;
    return placedOrders;
  }, [tab, placedOrders, deliveredOrders, pendingDeliveryOrders]);

  const detailOrders = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    const result = detailSource.filter((order) => {
      if (!searchText) return true;

      return (
        String(order?.id || "").toLowerCase().includes(searchText) ||
        String(order?.orderCode || "").toLowerCase().includes(searchText) ||
        String(order?.userId || "").toLowerCase().includes(searchText) ||
        String(getStatusText(order?.status) || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

    return result.sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [detailSource, keyword]);

  // Dữ liệu biểu đồ nhóm theo ngày
  const chartData = useMemo(() => groupByDate(detailOrders), [detailOrders]);

  const totalPages = Math.max(1, Math.ceil(detailOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return detailOrders.slice(start, start + PAGE_SIZE);
  }, [detailOrders, safeCurrentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setKeyword("");
    setFromDate("");
    setToDate("");
    setTab("placed");
    setCurrentPage(1);
  };

  return (
    <div className="admin-finance-page">
      <div className="admin-finance-header">
        <h2 className="admin-finance-title">Báo cáo tài chính</h2>

        <p className="admin-finance-desc">
          Thống kê doanh thu từ đơn khách đã đặt và đơn đã giao thành công.
        </p>
      </div>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      <div className="admin-finance-alert-box">
        <div className="admin-finance-alert-inner">
          <div>
            <div className="admin-finance-alert-title">Tổng quan doanh thu</div>

            <div className="admin-finance-alert-text">
              Trang này đang tính theo dữ liệu đơn hàng hiện có trong hệ thống.
              <br />
              Đơn đã đặt: không tính đơn đã hủy và đã hoàn hàng.
              <br />
              Đơn đã giao: chỉ tính đơn có trạng thái hoàn thành.
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="btn btn-outline-danger admin-finance-reload-btn"
          >
            Tải lại
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Đơn đã đặt</div>
            <div className="admin-finance-summary-value">{formatPrice(placedRevenue)}</div>
            <div className="admin-finance-summary-sub">{placedOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Đơn đã giao</div>
            <div className="admin-finance-summary-value green">{formatPrice(deliveredRevenue)}</div>
            <div className="admin-finance-summary-sub">{deliveredOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Doanh thu chờ giao</div>
            <div className="admin-finance-summary-value blue">{formatPrice(pendingDeliveryRevenue)}</div>
            <div className="admin-finance-summary-sub">{pendingDeliveryOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Tỷ lệ hoàn thành</div>
            <div className="admin-finance-summary-value purple">{completionRate}%</div>
            <div className="admin-finance-summary-sub">
              {deliveredOrders.length}/{placedOrders.length} đơn
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="admin-finance-filter-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label admin-finance-label">Tìm kiếm đơn hàng</label>
            <input
              className="form-control admin-finance-input"
              placeholder="Nhập mã đơn, ID hoặc trạng thái..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label admin-finance-label">Từ ngày</label>
            <input
              type="date"
              className="form-control admin-finance-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label admin-finance-label">Đến ngày</label>
            <input
              type="date"
              className="form-control admin-finance-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-outline-secondary w-100 admin-finance-clear-btn"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* Detail section */}
      <div className="admin-finance-detail-card">
        <div className="admin-finance-detail-head">
          <div className="admin-finance-detail-head-top">
            <h4 className="admin-finance-detail-title">Chi tiết doanh thu</h4>

            <div className="d-flex align-items-center gap-2">
              <div className="admin-finance-detail-count">
                {detailOrders.length} đơn hàng
                {viewMode === "table" && ` • Trang ${safeCurrentPage}/${totalPages}`}
              </div>

              {/* Toggle bảng / biểu đồ */}
              <div className="btn-group" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title="Dạng bảng"
                  className={`btn btn-sm ${
                    viewMode === "table" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                >
                  <IconTable />Bảng
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("bar")}
                  title="Biểu đồ cột"
                  className={`btn btn-sm ${
                    viewMode === "bar" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                >
                  <IconBar />Cột
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("line")}
                  title="Biểu đồ đường"
                  className={`btn btn-sm ${
                    viewMode === "line" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                >
                  <IconLine />Đường
                </button>
              </div>
            </div>
          </div>

          <div className="admin-finance-tabs">
            <button
              type="button"
              onClick={() => setTab("placed")}
              className={`admin-finance-tab ${tab === "placed" ? "active" : ""}`}
            >
              Đơn đã đặt
            </button>

            <button
              type="button"
              onClick={() => setTab("delivered")}
              className={`admin-finance-tab ${tab === "delivered" ? "active" : ""}`}
            >
              Đơn đã giao
            </button>

            <button
              type="button"
              onClick={() => setTab("pending")}
              className={`admin-finance-tab ${tab === "pending" ? "active" : ""}`}
            >
              Đơn chờ giao
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-finance-loading">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="admin-finance-loading-text">Đang tải báo cáo tài chính...</p>
          </div>
        ) : detailOrders.length === 0 ? (
          <div className="admin-finance-empty">Không có dữ liệu phù hợp.</div>
        ) : (
          <>
            {/* ── BẢNG ── */}
            {viewMode === "table" && (
              <>
                <div className="table-responsive">
                  <table className="admin-finance-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>ID</th>
                        <th>Khách hàng</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Tạm tính</th>
                        <th>Phí ship</th>
                        <th>Tổng tiền</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedOrders.map((order) => {
                        const badge = getStatusBadge(order.status);

                        return (
                          <tr key={order.id}>
                            <td className="admin-finance-order-code">
                              {order.orderCode || "-"}
                            </td>
                            <td>{order.id}</td>
                            <td>{order.userId ? `#${order.userId}` : "-"}</td>
                            <td>{formatDateTime(order.createdAt)}</td>
                            <td>
                              <span className={`admin-finance-status ${badge.className}`}>
                                {badge.text}
                              </span>
                            </td>
                            <td className="admin-finance-nowrap">
                              {formatPrice(order.subtotal)}
                            </td>
                            <td className="admin-finance-nowrap">
                              {formatPrice(order.shippingFee)}
                            </td>
                            <td className="admin-finance-total">
                              {formatPrice(order.totalAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="admin-finance-footer">
                  <div className="admin-finance-page-limit">
                    Hiển thị tối đa {PAGE_SIZE} đơn hàng mỗi trang
                  </div>

                  <div className="admin-finance-pagination">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-finance-page-btn"
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                    >
                      Trang trước
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToPage(page)}
                          className={`btn btn-sm admin-finance-page-btn ${
                            safeCurrentPage === page ? "active" : "btn-outline-primary"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-finance-page-btn"
                      onClick={() => goToPage(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── BIỂU ĐỒ CỘT ── */}
            {viewMode === "bar" && (
              <div style={{ marginTop: 16 }}>
                {chartData.length < 2 && (
                  <div className="alert alert-info" role="alert" style={{ fontSize: 13 }}>
                    Cần ít nhất 2 ngày dữ liệu để hiển thị biểu đồ. Hãy mở rộng khoảng thời gian lọc.
                  </div>
                )}

                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={formatPriceShort}
                      tick={{ fontSize: 12 }}
                      width={72}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Bảng tóm tắt theo ngày */}
                <div className="table-responsive mt-3">
                  <table className="admin-finance-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Số đơn</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{row.count}</td>
                          <td className="admin-finance-total">{formatPrice(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── BIỂU ĐỒ ĐƯỜNG ── */}
            {viewMode === "line" && (
              <div style={{ marginTop: 16 }}>
                {chartData.length < 2 && (
                  <div className="alert alert-info" role="alert" style={{ fontSize: 13 }}>
                    Cần ít nhất 2 ngày dữ liệu để hiển thị biểu đồ. Hãy mở rộng khoảng thời gian lọc.
                  </div>
                )}

                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={formatPriceShort}
                      tick={{ fontSize: 12 }}
                      width={72}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Số đơn"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Bảng tóm tắt theo ngày */}
                <div className="table-responsive mt-3">
                  <table className="admin-finance-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Số đơn</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{row.count}</td>
                          <td className="admin-finance-total">{formatPrice(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
