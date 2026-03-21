import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminVariantsService } from "../../services/admin/adminVariantsService";

const emptyForm = {
  sku: "",
  variantName: "",
  price: "",
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
  if (value === null || value === undefined || value === "") return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

export default function AdminProductVariantsPage() {
  const { productId } = useParams();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [productId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (v) => {
    setEditingId(v.id);
    setForm({
      sku: v.sku || "",
      variantName: v.variantName || "",
      price: v.price ?? "",
      isActive: !!v.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (!window.confirm(`Bạn có chắc muốn xóa biến thể #${id}?`)) return;

    try {
      await adminVariantsService.remove(productId, id);
      setMsg(`Đã xóa biến thể #${id}`);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa biến thể thất bại"));
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin/products" style={{ textDecoration: "none" }}>
          ← Quay lại sản phẩm
        </Link>
      </div>

      <div className="mb-4">
        <h2 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 6 }}>
          Quản lý biến thể của sản phẩm {productId}
        </h2>
        <p style={{ color: "#64748b", marginBottom: 0 }}>
          Quản lý SKU, tên biến thể, giá và trạng thái hoạt động của từng biến thể.
        </p>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h4 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 18 }}>
              {editingId ? "Chỉnh sửa biến thể" : "Tạo biến thể mới"}
            </h4>

            <div className="d-grid gap-3">
              <div>
                <label className="form-label" style={labelStyle}>
                  Mã Định Danh (SKU)
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: KEYCHAIN-RED-M"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="form-label" style={labelStyle}>
                  Tên biến thể
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: Đỏ - Cỡ M"
                  value={form.variantName}
                  onChange={(e) =>
                    setForm({ ...form, variantName: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="form-label" style={labelStyle}>
                  Giá
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Nhập giá biến thể"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="form-check">
                <input
                  id="variantIsActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label
                  htmlFor="variantIsActive"
                  className="form-check-label"
                  style={labelStyle}
                >
                  Biến thể đang hoạt động
                </label>
              </div>

              <div className="d-flex gap-2">
                <button
                  onClick={save}
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ height: 46, borderRadius: 12, fontWeight: 600 }}
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className="btn btn-outline-secondary"
                    style={{ height: 46, borderRadius: 12, fontWeight: 600 }}
                  >
                    Hủy
                  </button>
                )}
              </div>
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
            <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb" }}>
              <h4 style={{ marginBottom: 0, color: "#0f172a", fontWeight: 700 }}>
                Danh sách biến thể
              </h4>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
                <p className="mt-3 mb-0">Đang tải biến thể...</p>
              </div>
            ) : list.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>
                Chưa có biến thể nào cho sản phẩm này.
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>Mã</th>
                      <th style={thStyle}>Mã Định Danh (SKU)</th>
                      <th style={thStyle}>Tên biến thể</th>
                      <th style={thStyle}>Giá</th>
                      <th style={thStyle}>Trạng thái</th>
                      <th style={thStyle}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((v) => (
                      <tr key={v.id}>
                        <td style={tdStyle}>{v.id}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{v.sku}</td>
                        <td style={tdStyle}>{v.variantName}</td>
                        <td style={tdStyle}>{formatPrice(v.price)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: v.isActive ? "#dcfce7" : "#fee2e2",
                              color: v.isActive ? "#166534" : "#991b1b",
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {v.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              onClick={() => startEdit(v)}
                              className="btn btn-outline-primary btn-sm"
                              style={{ borderRadius: 10 }}
                            >
                              Sửa
                            </button>

                            <button
                              onClick={() => remove(v.id)}
                              className="btn btn-outline-danger btn-sm"
                              style={{ borderRadius: 10 }}
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

const labelStyle = {
  color: "#111827",
  fontWeight: 600,
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
  fontWeight: 700,
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "14px",
  color: "#334155",
  borderBottom: "1px solid #e5e7eb",
};