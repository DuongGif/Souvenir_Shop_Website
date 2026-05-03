import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminVariantsService } from "../../services/admin/adminVariantsService";

const createEmptyForm = () => ({
  sku: "",
  variantName: "",
  price: "",
  isActive: true,
});

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

export default function AdminProductVariantsPage() {
  const { productId } = useParams();

  const [list, setList] = useState([]);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminVariantsService.getAll(productId);
      setList(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách biến thể"));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
  };

  const startEdit = (variant) => {
    setEditingId(variant.id);

    setForm({
      sku: variant.sku || "",
      variantName: variant.variantName || "",
      price: variant.price ?? "",
      isActive: !!variant.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const save = async () => {
    setErr("");
    setMsg("");

    if (!form.sku.trim()) {
      setErr("SKU là bắt buộc");
      return;
    }

    if (!form.variantName.trim()) {
      setErr("Tên biến thể là bắt buộc");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setErr("Giá biến thể không hợp lệ");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        sku: form.sku.trim(),
        variantName: form.variantName.trim(),
        price: Number(form.price),
        isActive: form.isActive,
      };

      if (editingId) {
        await adminVariantsService.update(productId, editingId, payload);
        setMsg(`Đã cập nhật biến thể #${editingId}`);
      } else {
        await adminVariantsService.create(productId, payload);
        setMsg("Đã tạo biến thể mới");
      }

      resetForm();

      await load();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          editingId
            ? "Cập nhật biến thể thất bại"
            : "Tạo biến thể thất bại"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setErr("");
    setMsg("");

    const ok = window.confirm(`Bạn có chắc muốn xóa biến thể #${id}?`);
    if (!ok) return;

    try {
      await adminVariantsService.remove(productId, id);

      setMsg(`Đã xóa biến thể #${id}`);

      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa biến thể thất bại"));
    }
  };

  return (
    <div className="admin-variants-page">
      <div className="admin-variants-back-wrap">
        <Link to="/admin/products" className="admin-variants-back-link">
          ← Quay lại sản phẩm
        </Link>
      </div>

      <div className="admin-variants-header">
        <h2 className="admin-variants-title">
          Quản lý biến thể của sản phẩm {productId}
        </h2>

        <p className="admin-variants-desc">
          Quản lý SKU, tên biến thể, giá và trạng thái hoạt động của từng biến
          thể.
        </p>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="admin-variants-card admin-variants-form-card">
            <h4 className="admin-variants-form-title">
              {editingId ? "Chỉnh sửa biến thể" : "Tạo biến thể mới"}
            </h4>

            <div className="admin-variants-form-grid">
              <div>
                <label className="form-label admin-variants-label">
                  Mã Định Danh (SKU)
                </label>

                <input
                  className="form-control admin-variants-input"
                  placeholder="Ví dụ: KEYCHAIN-RED-M"
                  value={form.sku}
                  onChange={(e) => updateForm("sku", e.target.value)}
                />
              </div>

              <div>
                <label className="form-label admin-variants-label">
                  Tên biến thể
                </label>

                <input
                  className="form-control admin-variants-input"
                  placeholder="Ví dụ: Đỏ - Cỡ M"
                  value={form.variantName}
                  onChange={(e) => updateForm("variantName", e.target.value)}
                />
              </div>

              <div>
                <label className="form-label admin-variants-label">Giá</label>

                <input
                  type="number"
                  className="form-control admin-variants-input"
                  placeholder="Nhập giá biến thể"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                />
              </div>

              <div className="form-check">
                <input
                  id="variantIsActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(e) => updateForm("isActive", e.target.checked)}
                />

                <label
                  htmlFor="variantIsActive"
                  className="form-check-label admin-variants-check-label"
                >
                  Biến thể đang hoạt động
                </label>
              </div>

              <div className="admin-variants-actions">
                <button
                  type="button"
                  onClick={save}
                  className="btn btn-primary admin-variants-main-btn"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-outline-secondary admin-variants-main-btn"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="admin-variants-card admin-variants-list-card">
            <div className="admin-variants-list-head">
              <h4 className="admin-variants-list-title">
                Danh sách biến thể
              </h4>
            </div>

            {loading ? (
              <div className="admin-variants-loading">
                <div className="spinner-border text-info" role="status"></div>

                <p className="admin-variants-loading-text">
                  Đang tải biến thể...
                </p>
              </div>
            ) : list.length === 0 ? (
              <div className="admin-variants-empty">
                Chưa có biến thể nào cho sản phẩm này.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-variants-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Mã Định Danh (SKU)</th>
                      <th>Tên biến thể</th>
                      <th>Giá</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map((variant) => (
                      <tr key={variant.id}>
                        <td>{variant.id}</td>

                        <td className="admin-variants-sku">{variant.sku}</td>

                        <td>{variant.variantName}</td>

                        <td className="admin-variants-price">
                          {formatPrice(variant.price)}
                        </td>

                        <td>
                          <span
                            className={`admin-variants-status ${
                              variant.isActive ? "active" : "inactive"
                            }`}
                          >
                            {variant.isActive
                              ? "Đang hoạt động"
                              : "Ngừng hoạt động"}
                          </span>
                        </td>

                        <td>
                          <div className="admin-variants-action-list">
                            <button
                              type="button"
                              onClick={() => startEdit(variant)}
                              className="btn btn-outline-primary btn-sm admin-variants-action-btn"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => remove(variant.id)}
                              className="btn btn-outline-danger btn-sm admin-variants-action-btn"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}