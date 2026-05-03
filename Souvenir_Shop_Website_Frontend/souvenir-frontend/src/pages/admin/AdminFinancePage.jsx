import { useCallback, useEffect, useMemo, useState } from "react";
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

  if (value === "pending") {
    return {
      text: "Chờ xử lý",
      className: "pending",
    };
  }

  if (value === "confirmed") {
    return {
      text: "Đã xác nhận",
      className: "confirmed",
    };
  }

  if (value === "paid") {
    return {
      text: "Đã thanh toán",
      className: "paid",
    };
  }

  if (value === "shipping") {
    return {
      text: "Đang giao hàng",
      className: "shipping",
    };
  }

  if (value === "completed") {
    return {
      text: "Hoàn thành",
      className: "completed",
    };
  }

  if (value === "cancel_requested") {
    return {
      text: "Chờ duyệt hủy",
      className: "cancel-requested",
    };
  }

  if (value === "return_requested") {
    return {
      text: "Yêu cầu hoàn hàng",
      className: "return-requested",
    };
  }

  if (value === "returned") {
    return {
      text: "Đã hoàn hàng",
      className: "returned",
    };
  }

  if (value === "cancelled") {
    return {
      text: "Đã hủy",
      className: "cancelled",
    };
  }

  return {
    text: getStatusText(status),
    className: "unknown",
  };
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

export default function AdminFinancePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState("placed");
  const [currentPage, setCurrentPage] = useState(1);

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

  const placedOrders = useMemo(() => {
    return reportOrders.filter(isPlacedOrder);
  }, [reportOrders]);

  const deliveredOrders = useMemo(() => {
    return reportOrders.filter(isDeliveredOrder);
  }, [reportOrders]);

  const pendingDeliveryOrders = useMemo(() => {
    return reportOrders.filter(isPendingDeliveryOrder);
  }, [reportOrders]);

  const placedRevenue = useMemo(() => {
    return sumRevenue(placedOrders);
  }, [placedOrders]);

  const deliveredRevenue = useMemo(() => {
    return sumRevenue(deliveredOrders);
  }, [deliveredOrders]);

  const pendingDeliveryRevenue = useMemo(() => {
    return sumRevenue(pendingDeliveryOrders);
  }, [pendingDeliveryOrders]);

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

  const totalPages = Math.max(1, Math.ceil(detailOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return detailOrders.slice(start, start + PAGE_SIZE);
  }, [detailOrders, safeCurrentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
            <div className="admin-finance-alert-title">
              Tổng quan doanh thu
            </div>

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

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Đơn đã đặt</div>

            <div className="admin-finance-summary-value">
              {formatPrice(placedRevenue)}
            </div>

            <div className="admin-finance-summary-sub">
              {placedOrders.length} đơn
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">Đơn đã giao</div>

            <div className="admin-finance-summary-value green">
              {formatPrice(deliveredRevenue)}
            </div>

            <div className="admin-finance-summary-sub">
              {deliveredOrders.length} đơn
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">
              Doanh thu chờ giao
            </div>

            <div className="admin-finance-summary-value blue">
              {formatPrice(pendingDeliveryRevenue)}
            </div>

            <div className="admin-finance-summary-sub">
              {pendingDeliveryOrders.length} đơn
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-finance-summary-card">
            <div className="admin-finance-summary-label">
              Tỷ lệ hoàn thành
            </div>

            <div className="admin-finance-summary-value purple">
              {completionRate}%
            </div>

            <div className="admin-finance-summary-sub">
              {deliveredOrders.length}/{placedOrders.length} đơn
            </div>
          </div>
        </div>
      </div>

      <div className="admin-finance-filter-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label admin-finance-label">
              Tìm kiếm đơn hàng
            </label>

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

      <div className="admin-finance-detail-card">
        <div className="admin-finance-detail-head">
          <div className="admin-finance-detail-head-top">
            <h4 className="admin-finance-detail-title">Chi tiết doanh thu</h4>

            <div className="admin-finance-detail-count">
              Hiển thị {detailOrders.length} đơn hàng • Trang {safeCurrentPage}/
              {totalPages}
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
              className={`admin-finance-tab ${
                tab === "delivered" ? "active" : ""
              }`}
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

            <p className="admin-finance-loading-text">
              Đang tải báo cáo tài chính...
            </p>
          </div>
        ) : detailOrders.length === 0 ? (
          <div className="admin-finance-empty">Không có dữ liệu phù hợp.</div>
        ) : (
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
                          <span
                            className={`admin-finance-status ${badge.className}`}
                          >
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
                        safeCurrentPage === page
                          ? "active"
                          : "btn-outline-primary"
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
      </div>
    </div>
  );
}