import { useCallback, useEffect, useMemo, useState } from "react";
import { adminOrdersService } from "../../services/admin/adminOrdersService";

const PAGE_SIZE = 5;

const STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "shipping", label: "Đang giao hàng" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancel_requested", label: "Chờ duyệt hủy" },
  { value: "return_requested", label: "Yêu cầu hoàn hàng" },
  { value: "returned", label: "Đã hoàn hàng" },
  { value: "cancelled", label: "Đã hủy" },
];

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
  if (value === null || value === undefined) return "0 ₫";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
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

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  const found = STATUS_OPTIONS.find((item) => item.value === normalized);

  return found ? found.label : status || "Không xác định";
};

const getStatusBadge = (status) => {
  const value = normalizeStatus(status);

  if (value === "pending") {
    return { text: "Chờ xử lý", className: "pending" };
  }
  if (value === "confirmed") {
    return { text: "Đã xác nhận", className: "confirmed" };
  }
  if (value === "paid") {
    return { text: "Đã thanh toán", className: "paid" };
  }
  if (value === "shipping") {
    return { text: "Đang giao hàng", className: "shipping" };
  }
  if (value === "completed") {
    return { text: "Hoàn thành", className: "completed" };
  }
  if (value === "cancel_requested") {
    return { text: "Chờ duyệt hủy", className: "cancel-requested" };
  }
  if (value === "return_requested") {
    return { text: "Yêu cầu hoàn hàng", className: "return-requested" };
  }
  if (value === "returned") {
    return { text: "Đã hoàn hàng", className: "returned" };
  }
  if (value === "cancelled") {
    return { text: "Đã hủy", className: "cancelled" };
  }

  return {
    text: getStatusLabel(status),
    className: "unknown",
  };
};

// Giới hạn các trạng thái có thể chuyển dựa trên trạng thái hiện tại
const getAvailableStatuses = (currentStatus) => {
  const status = normalizeStatus(currentStatus);

  switch (status) {
    case "pending":
      return STATUS_OPTIONS.filter((s) =>
        ["pending", "confirmed", "cancelled"].includes(s.value)
      );

    case "confirmed":
      return STATUS_OPTIONS.filter((s) =>
        ["confirmed", "paid", "cancelled"].includes(s.value)
      );

    case "paid":
      return STATUS_OPTIONS.filter((s) =>
        ["paid", "shipping", "cancelled"].includes(s.value)
      );

    case "shipping":
      return STATUS_OPTIONS.filter((s) =>
        ["shipping", "completed", "cancelled"].includes(s.value)
      );

    case "completed":
      // Chỉ cho phép yêu cầu hoàn hàng sau khi hoàn thành
      return STATUS_OPTIONS.filter((s) =>
        ["completed", "return_requested"].includes(s.value)
      );

    case "cancel_requested":
      return STATUS_OPTIONS.filter((s) =>
        ["cancel_requested", "cancelled"].includes(s.value)
      );

    case "return_requested":
      return STATUS_OPTIONS.filter((s) =>
        ["return_requested", "returned"].includes(s.value)
      );

    // Trạng thái cuối — không cho thay đổi
    case "returned":
    case "cancelled":
      return STATUS_OPTIONS.filter((s) => s.value === status);

    default:
      return STATUS_OPTIONS;
  }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminOrdersService.getAll();
      const data = res.data || [];

      setOrders(data);

      const initialStatusMap = {};

      data.forEach((order) => {
        initialStatusMap[order.id] = normalizeStatus(order.status);
      });

      setStatusMap(initialStatusMap);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách đơn hàng"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  const updateStatus = async (id) => {
    setErr("");
    setMsg("");

    try {
      setSavingId(id);

      const normalizedStatus = normalizeStatus(statusMap[id]);

      await adminOrdersService.updateStatus(id, normalizedStatus);

      setMsg(`Đã cập nhật trạng thái đơn hàng #${id}`);

      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Cập nhật trạng thái thất bại"));
    } finally {
      setSavingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) => {
      const idText = String(order.id || "").toLowerCase();
      const orderCodeText = String(order.orderCode || "").toLowerCase();
      const statusText = String(getStatusLabel(order.status) || "").toLowerCase();

      return (
        idText.includes(keyword) ||
        orderCodeText.includes(keyword) ||
        statusText.includes(keyword)
      );
    });
  }, [orders, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, safeCurrentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <div>
          <h2 className="admin-orders-title">Quản lý đơn hàng</h2>

          <p className="admin-orders-desc">
            Theo dõi danh sách đơn hàng, tìm kiếm và cập nhật trạng thái xử lý.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="btn btn-outline-primary admin-orders-reload-btn"
        >
          Tải lại
        </button>
      </div>

      <div className="admin-orders-filter-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-6 col-lg-5">
            <label className="form-label admin-orders-label">
              Tìm kiếm đơn hàng
            </label>

            <input
              className="form-control admin-orders-input"
              placeholder="Nhập mã đơn hàng hoặc trạng thái..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className="col-md-6 col-lg-7">
            <div className="admin-orders-stats">
              <span>Tổng đơn: {orders.length}</span>
              <span>Kết quả: {filteredOrders.length}</span>
              <span>
                Trang {safeCurrentPage} / {totalPages}
              </span>
            </div>
          </div>
        </div>
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
        <div className="admin-orders-loading">
          <div className="spinner-border text-info" role="status"></div>

          <p className="admin-orders-loading-text">
            Đang tải danh sách đơn hàng...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-orders-empty">
          Không tìm thấy đơn hàng nào.
        </div>
      ) : (
        <>
          <div className="admin-orders-table-card">
            <div className="table-responsive">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Mã đơn hàng</th>
                    <th>Tạm tính</th>
                    <th>Phí vận chuyển</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    const availableStatuses = getAvailableStatuses(order.status);
                    const isTerminal =
                      normalizeStatus(order.status) === "returned" ||
                      normalizeStatus(order.status) === "cancelled";

                    return (
                      <tr key={order.id}>
                        <td>{order.id}</td>

                        <td className="admin-orders-code">
                          {order.orderCode}
                        </td>

                        <td className="admin-orders-nowrap">
                          {formatPrice(order.subtotal)}
                        </td>

                        <td className="admin-orders-nowrap">
                          {formatPrice(order.shippingFee)}
                        </td>

                        <td className="admin-orders-total">
                          {formatPrice(order.totalAmount)}
                        </td>

                        <td>
                          <span
                            className={`admin-orders-status-badge ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        </td>

                        <td>
                          <div className="admin-orders-update-box">
                            <select
                              className="form-select form-select-sm admin-orders-status-select"
                              value={
                                statusMap[order.id] ||
                                normalizeStatus(order.status) ||
                                "pending"
                              }
                              onChange={(e) =>
                                setStatusMap((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              disabled={isTerminal}
                            >
                              {availableStatuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => updateStatus(order.id)}
                              className="btn btn-outline-primary btn-sm admin-orders-save-btn"
                              disabled={savingId === order.id || isTerminal}
                            >
                              {savingId === order.id ? "Đang lưu..." : "Lưu"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-orders-pagination-wrap">
            <div className="admin-orders-limit-text">
              Hiển thị tối đa {PAGE_SIZE} đơn hàng mỗi trang
            </div>

            <div className="admin-orders-pagination">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm admin-orders-page-btn"
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
                    className={`btn btn-sm admin-orders-page-btn ${
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
                className="btn btn-outline-secondary btn-sm admin-orders-page-btn"
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
  );
}
