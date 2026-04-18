import React, { useEffect, useMemo, useState } from "react";
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
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeStatus = (status) => {
  const s = String(status || "").trim().toLowerCase();

  if (
    s === "dang_giao" ||
    s === "đang giao" ||
    s === "da_giao_van" ||
    s === "shipped"
  ) {
    return "shipping";
  }

  if (s === "canceled") return "cancelled";
  if (s === "pending_cancel") return "cancel_requested";
  if (s === "cho_duyet_huy") return "cancel_requested";
  if (s === "yeu_cau_huy") return "cancel_requested";
  if (s === "yeu_cau_hoan_hang") return "return_requested";
  if (s === "da_hoan_hang") return "returned";

  return s || "pending";
};

const getStatusText = (status) => {
  const s = normalizeStatus(status);

  if (s === "pending") return "Chờ xử lý";
  if (s === "confirmed") return "Đã xác nhận";
  if (s === "paid") return "Đã thanh toán";
  if (s === "shipping") return "Đang giao hàng";
  if (s === "completed") return "Hoàn thành";
  if (s === "cancel_requested") return "Chờ duyệt hủy";
  if (s === "return_requested") return "Yêu cầu hoàn hàng";
  if (s === "returned") return "Đã hoàn hàng";
  if (s === "cancelled") return "Đã hủy";

  return status || "Không xác định";
};

const getStatusBadge = (status) => {
  const s = normalizeStatus(status);

  if (s === "pending") {
    return { text: "Chờ xử lý", bg: "#fef3c7", color: "#92400e" };
  }
  if (s === "confirmed") {
    return { text: "Đã xác nhận", bg: "#e5e7eb", color: "#374151" };
  }
  if (s === "paid") {
    return { text: "Đã thanh toán", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "shipping") {
    return { text: "Đang giao hàng", bg: "#dbeafe", color: "#1d4ed8" };
  }
  if (s === "completed") {
    return { text: "Hoàn thành", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "cancel_requested") {
    return { text: "Chờ duyệt hủy", bg: "#fff7ed", color: "#9a3412" };
  }
  if (s === "return_requested") {
    return { text: "Yêu cầu hoàn hàng", bg: "#f3e8ff", color: "#7e22ce" };
  }
  if (s === "returned") {
    return { text: "Đã hoàn hàng", bg: "#ede9fe", color: "#5b21b6" };
  }
  if (s === "cancelled") {
    return { text: "Đã hủy", bg: "#fee2e2", color: "#991b1b" };
  }

  return { text: getStatusText(status), bg: "#e5e7eb", color: "#374151" };
};

const isPlacedOrder = (order) => {
  const s = normalizeStatus(order?.status);
  return s !== "cancelled" && s !== "returned";
};

const isDeliveredOrder = (order) => {
  const s = normalizeStatus(order?.status);
  return s === "completed";
};

const isPendingDeliveryOrder = (order) => {
  return isPlacedOrder(order) && !isDeliveredOrder(order);
};

const sumRevenue = (items) => {
  return items.reduce((sum, item) => sum + Number(item?.totalAmount || 0), 0);
};

const isInDateRange = (dateValue, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  if (!dateValue) return false;

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (d < from) return false;
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59`);
    if (d > to) return false;
  }

  return true;
};

export default function AdminFinancePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState("placed");
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, fromDate, toDate, tab]);

  const reportOrders = useMemo(() => {
    return orders.filter((o) => isInDateRange(o?.createdAt, fromDate, toDate));
  }, [orders, fromDate, toDate]);

  const placedOrders = useMemo(
    () => reportOrders.filter(isPlacedOrder),
    [reportOrders]
  );

  const deliveredOrders = useMemo(
    () => reportOrders.filter(isDeliveredOrder),
    [reportOrders]
  );

  const pendingDeliveryOrders = useMemo(
    () => reportOrders.filter(isPendingDeliveryOrder),
    [reportOrders]
  );

  const placedRevenue = useMemo(() => sumRevenue(placedOrders), [placedOrders]);
  const deliveredRevenue = useMemo(
    () => sumRevenue(deliveredOrders),
    [deliveredOrders]
  );
  const pendingDeliveryRevenue = useMemo(
    () => sumRevenue(pendingDeliveryOrders),
    [pendingDeliveryOrders]
  );

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
    const k = keyword.trim().toLowerCase();

    const result = detailSource.filter((o) => {
      if (!k) return true;

      return (
        String(o?.id || "").toLowerCase().includes(k) ||
        String(o?.orderCode || "").toLowerCase().includes(k) ||
        String(o?.userId || "").toLowerCase().includes(k) ||
        String(getStatusText(o?.status) || "").toLowerCase().includes(k)
      );
    });

    return result.sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });
  }, [detailSource, keyword]);

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

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ marginBottom: 6, color: "#0f172a", fontWeight: 800 }}>
          Báo cáo tài chính
        </h2>
        <p style={{ marginBottom: 0, color: "#64748b" }}>
          Thống kê doanh thu từ đơn khách đã đặt và đơn đã giao thành công.
        </p>
      </div>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      <div
        style={{
          background: "#fff7f5",
          border: "1px solid #ffd7cc",
          borderRadius: 20,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: "#9a3412",
                marginBottom: 8,
              }}
            >
              Tổng quan doanh thu
            </div>
            <div style={{ color: "#7c2d12", lineHeight: 1.7 }}>
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
            className="btn btn-outline-danger"
            style={{ borderRadius: 12, fontWeight: 700 }}
          >
            Tải lại
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Đơn đã đặt</div>
            <div style={summaryValueStyle}>{formatPrice(placedRevenue)}</div>
            <div style={summarySubStyle}>{placedOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Đơn đã giao</div>
            <div style={{ ...summaryValueStyle, color: "#16a34a" }}>
              {formatPrice(deliveredRevenue)}
            </div>
            <div style={summarySubStyle}>{deliveredOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Doanh thu chờ giao</div>
            <div style={{ ...summaryValueStyle, color: "#2563eb" }}>
              {formatPrice(pendingDeliveryRevenue)}
            </div>
            <div style={summarySubStyle}>{pendingDeliveryOrders.length} đơn</div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Tỷ lệ hoàn thành</div>
            <div style={{ ...summaryValueStyle, color: "#7c3aed" }}>
              {completionRate}%
            </div>
            <div style={summarySubStyle}>
              {deliveredOrders.length}/{placedOrders.length} đơn
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: 18,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          marginBottom: 20,
        }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label" style={labelStyle}>
              Tìm kiếm đơn hàng
            </label>
            <input
              className="form-control"
              placeholder="Nhập mã đơn, ID hoặc trạng thái..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label" style={labelStyle}>
              Từ ngày
            </label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label" style={labelStyle}>
              Đến ngày
            </label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="col-md-2">
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setFromDate("");
                setToDate("");
                setTab("placed");
                setCurrentPage(1);
              }}
              className="btn btn-outline-secondary w-100"
              style={{ borderRadius: 12, height: 46, fontWeight: 700 }}
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #e5e7eb" }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h4
              style={{
                margin: 0,
                color: "#0f172a",
                fontWeight: 800,
                fontSize: 26,
              }}
            >
              Chi tiết doanh thu
            </h4>

            <div style={{ color: "#64748b", fontWeight: 600 }}>
              Hiển thị {detailOrders.length} đơn hàng • Trang {safeCurrentPage}/
              {totalPages}
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTab("placed")}
              className={`btn ${tab === "placed" ? "btn-danger" : "btn-outline-danger"}`}
              style={{ borderRadius: 999, fontWeight: 700 }}
            >
              Đơn đã đặt
            </button>

            <button
              type="button"
              onClick={() => setTab("delivered")}
              className={`btn ${tab === "delivered" ? "btn-danger" : "btn-outline-danger"}`}
              style={{ borderRadius: 999, fontWeight: 700 }}
            >
              Đơn đã giao
            </button>

            <button
              type="button"
              onClick={() => setTab("pending")}
              className={`btn ${tab === "pending" ? "btn-danger" : "btn-outline-danger"}`}
              style={{ borderRadius: 999, fontWeight: 700 }}
            >
              Đơn chờ giao
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="mt-3 mb-0">Đang tải báo cáo tài chính...</p>
          </div>
        ) : detailOrders.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b" }}>
            Không có dữ liệu phù hợp.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table
                style={{
                  width: "100%",
                  minWidth: 980,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Mã đơn</th>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Khách hàng</th>
                    <th style={thStyle}>Ngày tạo</th>
                    <th style={thStyle}>Trạng thái</th>
                    <th style={thStyle}>Tạm tính</th>
                    <th style={thStyle}>Phí ship</th>
                    <th style={thStyle}>Tổng tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedOrders.map((o) => {
                    const badge = getStatusBadge(o.status);

                    return (
                      <tr key={o.id}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {o.orderCode || "-"}
                        </td>

                        <td style={tdStyle}>{o.id}</td>

                        <td style={tdStyle}>{o.userId ? `#${o.userId}` : "-"}</td>

                        <td style={tdStyle}>{formatDateTime(o.createdAt)}</td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {badge.text}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          {formatPrice(o.subtotal)}
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          {formatPrice(o.shippingFee)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            whiteSpace: "nowrap",
                            fontWeight: 800,
                            color: "#ee4d2d",
                          }}
                        >
                          {formatPrice(o.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-3 border-top">
              <div style={{ color: "#64748b", fontWeight: 500 }}>
                Hiển thị tối đa {PAGE_SIZE} đơn hàng mỗi trang
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  style={{ borderRadius: 10, fontWeight: 600 }}
                >
                  Trang trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`btn btn-sm ${
                        safeCurrentPage === page
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => goToPage(page)}
                      style={{
                        minWidth: 40,
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  style={{ borderRadius: 10, fontWeight: 600 }}
                >
                  Trang sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const summaryCardStyle = {
  background: "#fff",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  height: "100%",
};

const summaryLabelStyle = {
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 12,
  fontSize: 15,
};

const summaryValueStyle = {
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 32,
  lineHeight: 1.2,
  marginBottom: 8,
};

const summarySubStyle = {
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 600,
};

const labelStyle = {
  color: "#111827",
  fontWeight: 700,
};

const inputStyle = {
  height: 46,
  borderRadius: 12,
  color: "#111827",
};

const thStyle = {
  padding: "14px",
  textAlign: "left",
  color: "#0f172a",
  fontWeight: 800,
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px",
  color: "#334155",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "middle",
};