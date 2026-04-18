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
  if (value === null || value === undefined) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

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

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  const found = STATUS_OPTIONS.find((x) => x.value === normalized);
  return found ? found.label : status || "Không xác định";
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

  return { text: getStatusLabel(status), bg: "#e5e7eb", color: "#374151" };
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

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminOrdersService.getAll();
      const data = res.data || [];
      setOrders(data);

      const initialStatusMap = {};
      data.forEach((o) => {
        initialStatusMap[o.id] = normalizeStatus(o.status);
      });
      setStatusMap(initialStatusMap);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách đơn hàng"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

    return orders.filter((o) => {
      const idText = String(o.id || "").toLowerCase();
      const orderCodeText = String(o.orderCode || "").toLowerCase();
      const statusText = String(getStatusLabel(o.status) || "").toLowerCase();

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2
            style={{
              marginBottom: 6,
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            Quản lý đơn hàng
          </h2>
          <p style={{ marginBottom: 0, color: "#64748b" }}>
            Theo dõi danh sách đơn hàng, tìm kiếm và cập nhật trạng thái xử lý.
          </p>
        </div>

        <button
          onClick={load}
          className="btn btn-outline-primary"
          style={{ borderRadius: 12, height: 42 }}
        >
          Tải lại
        </button>
      </div>

      <div
        className="mb-4"
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 18,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-6 col-lg-5">
            <label
              className="form-label"
              style={{ color: "#111827", fontWeight: 600 }}
            >
              Tìm kiếm đơn hàng
            </label>
            <input
              className="form-control"
              placeholder="Nhập mã đơn hàng hoặc trạng thái..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ height: 44, borderRadius: 12, color: "#111827" }}
            />
          </div>

          <div className="col-md-6 col-lg-7">
            <div
              className="d-flex flex-wrap gap-3"
              style={{ color: "#64748b", fontWeight: 500 }}
            >
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
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3 mb-0">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            color: "#475569",
          }}
        >
          Không tìm thấy đơn hàng nào.
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div className="table-responsive">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#1f2937",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Id</th>
                    <th style={thStyle}>Mã đơn hàng</th>
                    <th style={thStyle}>Tạm tính</th>
                    <th style={thStyle}>Phí vận chuyển</th>
                    <th style={thStyle}>Tổng tiền</th>
                    <th style={thStyle}>Trạng thái</th>
                    <th style={thStyle}>Cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedOrders.map((o) => {
                    const badge = getStatusBadge(o.status);

                    return (
                      <tr key={o.id}>
                        <td style={tdStyle}>{o.id}</td>

                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {o.orderCode}
                        </td>

                        <td style={tdStyle}>{formatPrice(o.subtotal)}</td>

                        <td style={tdStyle}>{formatPrice(o.shippingFee)}</td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            color: "#2563eb",
                          }}
                        >
                          {formatPrice(o.totalAmount)}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {badge.text}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div className="d-flex gap-2 flex-wrap">
                            <select
                              className="form-select form-select-sm"
                              value={
                                statusMap[o.id] ||
                                normalizeStatus(o.status) ||
                                "pending"
                              }
                              onChange={(e) =>
                                setStatusMap({
                                  ...statusMap,
                                  [o.id]: e.target.value,
                                })
                              }
                              style={{
                                width: 190,
                                borderRadius: 10,
                                color: "#111827",
                              }}
                            >
                              {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => updateStatus(o.id)}
                              className="btn btn-outline-primary btn-sm"
                              disabled={savingId === o.id}
                              style={{ borderRadius: 10, fontWeight: 600 }}
                            >
                              {savingId === o.id ? "Đang lưu..." : "Lưu"}
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

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4">
            <div style={{ color: "#64748b", fontWeight: 500 }}>
              Hiển thị tối đa {PAGE_SIZE} đơn hàng mỗi trang
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-outline-secondary btn-sm"
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
                className="btn btn-outline-secondary btn-sm"
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
  );
}

const thStyle = {
  padding: "14px",
  textAlign: "left",
  color: "#0f172a",
  fontWeight: 700,
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "14px",
  color: "#334155",
  borderBottom: "1px solid #e5e7eb",
};