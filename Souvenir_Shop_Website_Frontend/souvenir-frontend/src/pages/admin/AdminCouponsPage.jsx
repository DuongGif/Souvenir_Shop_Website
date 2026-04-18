import React, { useEffect, useMemo, useState } from "react";
import { adminCouponsService } from "../../services/admin/adminCouponsService";

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
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

const getTypeLabel = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "percentage") return "Phần trăm";
  if (t === "fixed") return "Giảm cố định";
  if (t === "free_shipping") return "Miễn phí vận chuyển";
  return type || "-";
};

export default function AdminCouponsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    minimumOrderValue: 0,
    maximumDiscount: "",
    totalUsageLimit: "",
    perUserLimit: "",
    isActive: true,
  });

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminCouponsService.getAll();
      const data = res.data || [];
      setList(data);

      const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
      setCurrentPage((prev) => (prev > totalPages ? totalPages : prev));
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách mã giảm giá"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setErr("");
    setMsg("");

    try {
      setCreating(true);

      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minimumOrderValue: Number(form.minimumOrderValue || 0),
        maximumDiscount:
          form.maximumDiscount === "" ? null : Number(form.maximumDiscount),
        totalUsageLimit:
          form.totalUsageLimit === "" ? null : Number(form.totalUsageLimit),
        perUserLimit:
          form.perUserLimit === "" ? null : Number(form.perUserLimit),
        isActive: form.isActive,
      };

      await adminCouponsService.create(payload);
      setMsg("Đã tạo mã giảm giá " + form.code);

      setForm({
        code: "",
        type: "percentage",
        value: 10,
        minimumOrderValue: 0,
        maximumDiscount: "",
        totalUsageLimit: "",
        perUserLimit: "",
        isActive: true,
      });

      setCurrentPage(1);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Tạo mã giảm giá thất bại"));
    } finally {
      setCreating(false);
    }
  };

  const remove = async (code) => {
    setErr("");
    setMsg("");

    if (!window.confirm(`Bạn có chắc muốn xóa mã giảm giá ${code}?`)) return;

    try {
      await adminCouponsService.remove(code);
      setMsg("Đã xóa mã giảm giá " + code);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa mã giảm giá thất bại"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="mb-4">
        <h2
          style={{
            marginBottom: 6,
            color: "#0f172a",
            fontWeight: 700,
          }}
        >
          Quản lý mã giảm giá
        </h2>
        <p style={{ marginBottom: 0, color: "#64748b" }}>
          Tạo mới, xem danh sách và xóa mã giảm giá khuyến mãi trong hệ thống.
        </p>
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

      <div className="row g-4 align-items-start">
        <div className="col-lg-4">
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h4
              style={{
                color: "#0f172a",
                fontWeight: 700,
                marginBottom: 16,
                fontSize: 22,
              }}
            >
              Tạo mã giảm giá mới
            </h4>

            <div className="d-grid gap-3">
              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Mã giảm giá
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: GIAM10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Loại giảm giá
                </label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                >
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Giảm cố định</option>
                  <option value="free_shipping">Miễn phí vận chuyển</option>
                </select>
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Giá trị giảm
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: Number(e.target.value) })
                  }
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Đơn hàng tối thiểu
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={form.minimumOrderValue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimumOrderValue: Number(e.target.value),
                    })
                  }
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Mức giảm tối đa
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.maximumDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maximumDiscount: e.target.value })
                  }
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Tổng lượt sử dụng
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.totalUsageLimit}
                  onChange={(e) =>
                    setForm({ ...form, totalUsageLimit: e.target.value })
                  }
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Giới hạn mỗi người dùng
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.perUserLimit}
                  onChange={(e) =>
                    setForm({ ...form, perUserLimit: e.target.value })
                  }
                  style={{ height: 42, borderRadius: 12, color: "#111827" }}
                />
              </div>

              <div className="form-check mt-1">
                <input
                  id="couponIsActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label
                  htmlFor="couponIsActive"
                  className="form-check-label"
                  style={{ color: "#111827", fontWeight: 500 }}
                >
                  Kích hoạt mã giảm giá
                </label>
              </div>

              <button
                onClick={create}
                className="btn btn-primary"
                disabled={creating}
                style={{
                  height: 42,
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                {creating ? "Đang tạo..." : "Tạo mã giảm giá"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h4
                  style={{
                    marginBottom: 0,
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  Danh sách mã giảm giá
                </h4>

                <span
                  style={{
                    color: "#64748b",
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Trang {currentPage} / {totalPages}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
                <p className="mt-3 mb-0">Đang tải mã giảm giá...</p>
              </div>
            ) : list.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>
                Chưa có mã giảm giá nào trong hệ thống.
              </div>
            ) : (
              <>
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
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Mã
                        </th>
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          Loại
                        </th>
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Giá trị
                        </th>
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          Đơn tối thiểu
                        </th>
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          Trạng thái
                        </th>
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            color: "#0f172a",
                            fontWeight: 700,
                            borderBottom: "1px solid #e5e7eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedCoupons.map((c) => (
                        <tr key={c.code}>
                          <td
                            style={{
                              padding: "14px",
                              color: "#334155",
                              borderBottom: "1px solid #e5e7eb",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.code}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#334155",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {getTypeLabel(c.type)}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#334155",
                              borderBottom: "1px solid #e5e7eb",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.type === "percentage"
                              ? `${c.value}%`
                              : c.type === "fixed"
                              ? formatPrice(c.value)
                              : c.value}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#334155",
                              borderBottom: "1px solid #e5e7eb",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPrice(c.minimumOrderValue)}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                background: c.isActive ? "#dcfce7" : "#fee2e2",
                                color: c.isActive ? "#166534" : "#991b1b",
                                padding: "6px 12px",
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <button
                              onClick={() => remove(c.code)}
                              className="btn btn-outline-danger btn-sm"
                              style={{
                                borderRadius: 10,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className="d-flex justify-content-between align-items-center flex-wrap gap-3"
                  style={{
                    padding: 16,
                    borderTop: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                >
                  <div style={{ color: "#64748b", fontWeight: 500 }}>
                    Hiển thị tối đa {PAGE_SIZE} mã mỗi trang
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ borderRadius: 10, fontWeight: 600 }}
                    >
                      Trang trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`btn btn-sm ${
                            currentPage === page
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
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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
      </div>
    </div>
  );
}