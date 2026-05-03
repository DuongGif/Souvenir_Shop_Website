import { useCallback, useEffect, useMemo, useState } from "react";
import { adminCouponsService } from "../../services/admin/adminCouponsService";

const PAGE_SIZE = 5;

const initialForm = {
  code: "",
  type: "percentage",
  value: 10,
  minimumOrderValue: 0,
  maximumDiscount: "",
  totalUsageLimit: "",
  perUserLimit: "",
  isActive: true,
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

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
};

const getTypeLabel = (type) => {
  const value = String(type || "").toLowerCase();

  if (value === "percentage") return "Phần trăm";
  if (value === "fixed") return "Giảm cố định";
  if (value === "free_shipping") return "Miễn phí vận chuyển";

  return type || "-";
};

const formatCouponValue = (coupon) => {
  if (coupon.type === "percentage") return `${coupon.value}%`;
  if (coupon.type === "fixed") return formatPrice(coupon.value);
  if (coupon.type === "free_shipping") return "Miễn phí ship";

  return coupon.value ?? "-";
};

export default function AdminCouponsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminCouponsService.getAll();
      const data = res.data || [];

      setList(data);

      const nextTotalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

      setCurrentPage((prev) => {
        return prev > nextTotalPages ? nextTotalPages : prev;
      });
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách mã giảm giá"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const create = async () => {
    setErr("");
    setMsg("");

    if (!form.code.trim()) {
      setErr("Vui lòng nhập mã giảm giá.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        code: form.code.trim().toUpperCase(),
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

      setMsg(`Đã tạo mã giảm giá ${payload.code}`);
      setForm(initialForm);
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

    const ok = window.confirm(`Bạn có chắc muốn xóa mã giảm giá ${code}?`);
    if (!ok) return;

    try {
      await adminCouponsService.remove(code);

      setMsg(`Đã xóa mã giảm giá ${code}`);

      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa mã giảm giá thất bại"));
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="admin-coupons-page">
      <div className="admin-coupons-header">
        <h2 className="admin-coupons-title">Quản lý mã giảm giá</h2>

        <p className="admin-coupons-desc">
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
          <div className="admin-coupons-card admin-coupons-form-card">
            <h4 className="admin-coupons-form-title">
              Tạo mã giảm giá mới
            </h4>

            <div className="admin-coupons-form-grid">
              <div>
                <label className="form-label admin-coupons-label">
                  Mã giảm giá
                </label>

                <input
                  className="form-control admin-coupons-input"
                  placeholder="Ví dụ: GIAM10"
                  value={form.code}
                  onChange={(e) => updateForm("code", e.target.value)}
                />
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Loại giảm giá
                </label>

                <select
                  className="form-select admin-coupons-input"
                  value={form.type}
                  onChange={(e) => updateForm("type", e.target.value)}
                >
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Giảm cố định</option>
                  <option value="free_shipping">Miễn phí vận chuyển</option>
                </select>
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Giá trị giảm
                </label>

                <input
                  type="number"
                  className="form-control admin-coupons-input"
                  value={form.value}
                  onChange={(e) => updateForm("value", e.target.value)}
                />
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Đơn hàng tối thiểu
                </label>

                <input
                  type="number"
                  className="form-control admin-coupons-input"
                  value={form.minimumOrderValue}
                  onChange={(e) =>
                    updateForm("minimumOrderValue", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Mức giảm tối đa
                </label>

                <input
                  type="number"
                  className="form-control admin-coupons-input"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.maximumDiscount}
                  onChange={(e) =>
                    updateForm("maximumDiscount", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Tổng lượt sử dụng
                </label>

                <input
                  type="number"
                  className="form-control admin-coupons-input"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.totalUsageLimit}
                  onChange={(e) =>
                    updateForm("totalUsageLimit", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="form-label admin-coupons-label">
                  Giới hạn mỗi người dùng
                </label>

                <input
                  type="number"
                  className="form-control admin-coupons-input"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.perUserLimit}
                  onChange={(e) => updateForm("perUserLimit", e.target.value)}
                />
              </div>

              <div className="form-check admin-coupons-check">
                <input
                  id="couponIsActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(e) => updateForm("isActive", e.target.checked)}
                />

                <label
                  htmlFor="couponIsActive"
                  className="form-check-label admin-coupons-check-label"
                >
                  Kích hoạt mã giảm giá
                </label>
              </div>

              <button
                type="button"
                onClick={create}
                className="btn btn-primary admin-coupons-submit"
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo mã giảm giá"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="admin-coupons-card admin-coupons-list-card">
            <div className="admin-coupons-list-head">
              <div className="admin-coupons-list-head-inner">
                <h4 className="admin-coupons-list-title">
                  Danh sách mã giảm giá
                </h4>

                <span className="admin-coupons-page-info">
                  Trang {currentPage} / {totalPages}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="admin-coupons-loading">
                <div className="spinner-border text-info" role="status"></div>
                <p className="admin-coupons-loading-text">
                  Đang tải mã giảm giá...
                </p>
              </div>
            ) : list.length === 0 ? (
              <div className="admin-coupons-empty">
                Chưa có mã giảm giá nào trong hệ thống.
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-coupons-table">
                    <thead>
                      <tr>
                        <th className="admin-coupons-nowrap">Mã</th>
                        <th>Loại</th>
                        <th className="admin-coupons-nowrap">Giá trị</th>
                        <th className="admin-coupons-nowrap">
                          Đơn tối thiểu
                        </th>
                        <th>Trạng thái</th>
                        <th className="admin-coupons-nowrap">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedCoupons.map((coupon) => (
                        <tr key={coupon.code}>
                          <td className="admin-coupons-nowrap admin-coupons-code">
                            {coupon.code}
                          </td>

                          <td>{getTypeLabel(coupon.type)}</td>

                          <td className="admin-coupons-nowrap">
                            {formatCouponValue(coupon)}
                          </td>

                          <td className="admin-coupons-nowrap">
                            {formatPrice(coupon.minimumOrderValue)}
                          </td>

                          <td>
                            <span
                              className={`admin-coupons-status ${
                                coupon.isActive ? "active" : "inactive"
                              }`}
                            >
                              {coupon.isActive
                                ? "Đang hoạt động"
                                : "Ngừng hoạt động"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => remove(coupon.code)}
                              className="btn btn-outline-danger btn-sm admin-coupons-delete"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-coupons-footer">
                  <div className="admin-coupons-limit-text">
                    Hiển thị tối đa {PAGE_SIZE} mã mỗi trang
                  </div>

                  <div className="admin-coupons-pagination">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm admin-coupons-page-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Trang trước
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`btn btn-sm admin-coupons-page-btn ${
                          currentPage === page
                            ? "active"
                            : "btn-outline-primary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm admin-coupons-page-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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