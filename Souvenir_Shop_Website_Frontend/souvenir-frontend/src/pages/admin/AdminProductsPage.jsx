import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminProductsService } from "../../services/admin/adminProductsService";

const PAGE_SIZE = 5;

const CATEGORY_OPTIONS = [
  { value: 1, label: "Quà lưu niệm" },
  { value: 2, label: "Đồ thủ công" },
  { value: 3, label: "Móc khóa" },
  { value: 4, label: "Áo du lịch" },
  { value: 5, label: "Phụ kiện" },
  { value: 6, label: "Đặc sản" },
  { value: 7, label: "Khác" },
];

const emptyForm = {
  slug: "",
  categoryId: "",
  basePrice: "",
  status: "active",
  isFeatured: false,
  imageUrls: [""],

  firstVariant: {
    sku: "",
    variantName: "",
    price: "",
    weightGrams: "",
    isActive: true,
    initialStock: 0,
  },
};

const API_ORIGIN = "https://localhost:7020";

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

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const getStatusText = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "active") return "Đang hoạt động";
  if (s === "inactive") return "Ngừng hoạt động";
  if (s === "hidden") return "Ẩn";

  return status || "Không xác định";
};

const getCategoryText = (categoryId) => {
  const found = CATEGORY_OPTIONS.find((x) => x.value === Number(categoryId));
  return found ? found.label : "Không xác định";
};

export default function AdminProductsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminProductsService.getAll();
      setList(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách sản phẩm"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, categoryFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = async (p) => {
    setErr("");
    try {
      const imgRes = await adminProductsService.getImages(p.id);
      const imageUrls = imgRes.data || [];

      setEditingId(p.id);
      setForm({
        slug: p.slug || "",
        categoryId: p.categoryId ?? "",
        basePrice: p.basePrice ?? "",
        status: p.status || "active",
        isFeatured: !!p.isFeatured,
        imageUrls: imageUrls.length > 0 ? imageUrls : [""],
        firstVariant: {
          sku: "",
          variantName: "",
          price: "",
          weightGrams: "",
          isActive: true,
          initialStock: 0,
        },
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải ảnh sản phẩm"));
    }
  };

  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ""],
    }));
  };

  const removeImageField = (index) => {
    const newUrls = form.imageUrls.filter((_, i) => i !== index);
    setForm({
      ...form,
      imageUrls: newUrls.length > 0 ? newUrls : [""],
    });
  };

  const handleChooseImage = async (index, file) => {
    if (!file) return;

    setErr("");
    setMsg("");

    try {
      setUploadingIndex(index);

      const res = await adminProductsService.uploadImage(file);
      const uploadedUrl = res.data?.imageUrl;

      if (!uploadedUrl) {
        throw new Error(
          "Tải ảnh lên thành công nhưng không nhận được đường dẫn ảnh"
        );
      }

      const newUrls = [...form.imageUrls];
      newUrls[index] = uploadedUrl;

      setForm((prev) => ({
        ...prev,
        imageUrls: newUrls,
      }));

      setMsg("Tải ảnh lên thành công");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Tải ảnh lên thất bại"));
    } finally {
      setUploadingIndex(null);
    }
  };

  const updateFirstVariantField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      firstVariant: {
        ...prev.firstVariant,
        [field]: value,
      },
    }));
  };

  const validateCreateVariant = () => {
    const v = form.firstVariant;

    if (!v.sku.trim()) {
      setErr("SKU biến thể đầu tiên là bắt buộc");
      return false;
    }

    if (!v.variantName.trim()) {
      setErr("Tên biến thể đầu tiên là bắt buộc");
      return false;
    }

    if (v.price !== "" && Number(v.price) < 0) {
      setErr("Giá biến thể không hợp lệ");
      return false;
    }

    if (v.weightGrams !== "" && Number(v.weightGrams) < 0) {
      setErr("Khối lượng biến thể không hợp lệ");
      return false;
    }

    if (v.initialStock === "" || Number(v.initialStock) < 0) {
      setErr("Tồn kho ban đầu không hợp lệ");
      return false;
    }

    return true;
  };

  const save = async () => {
    setErr("");
    setMsg("");

    if (!form.slug.trim()) {
      setErr("Đường dẫn là bắt buộc");
      return;
    }

    if (form.categoryId === "" || Number(form.categoryId) <= 0) {
      setErr("Danh mục không hợp lệ");
      return;
    }

    if (form.basePrice === "" || Number(form.basePrice) < 0) {
      setErr("Giá sản phẩm không hợp lệ");
      return;
    }

    const cleanImageUrls = form.imageUrls.filter((x) => x.trim() !== "");

    try {
      setSaving(true);

      if (editingId) {
        const productPayload = {
          slug: form.slug.trim(),
          categoryId: Number(form.categoryId),
          basePrice: Number(form.basePrice),
          status: form.status,
          isFeatured: form.isFeatured,
          images: cleanImageUrls,
          variants: [],
        };

        await adminProductsService.update(editingId, productPayload);
        setMsg(`Đã cập nhật sản phẩm #${editingId}`);
      } else {
        if (!validateCreateVariant()) {
          setSaving(false);
          return;
        }

        const v = form.firstVariant;

        const productPayload = {
          slug: form.slug.trim(),
          categoryId: Number(form.categoryId),
          basePrice: Number(form.basePrice),
          status: form.status,
          isFeatured: form.isFeatured,
          images: cleanImageUrls,
          variants: [
            {
              sku: v.sku.trim(),
              variantName: v.variantName.trim(),
              price: v.price === "" ? Number(form.basePrice) : Number(v.price),
              weightGrams: v.weightGrams === "" ? null : Number(v.weightGrams),
              isActive: !!v.isActive,
              initialStock: Number(v.initialStock || 0),
            },
          ],
        };

        await adminProductsService.create(productPayload);
        setMsg(`Đã tạo sản phẩm ${productPayload.slug}`);
      }

      resetForm();
      await load();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          editingId ? "Cập nhật sản phẩm thất bại" : "Tạo sản phẩm thất bại"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setErr("");
    setMsg("");

    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm #${id}?`)) return;

    try {
      await adminProductsService.remove(id);
      setMsg(`Đã xóa sản phẩm #${id}`);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xóa sản phẩm thất bại"));
    }
  };

  const filteredList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return list.filter((p) => {
      const matchKeyword =
        !keyword ||
        String(p.id || "")
          .toLowerCase()
          .includes(keyword) ||
        String(p.slug || "")
          .toLowerCase()
          .includes(keyword) ||
        String(p.categoryId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(getCategoryText(p.categoryId) || "")
          .toLowerCase()
          .includes(keyword) ||
        String(getStatusText(p.status) || "")
          .toLowerCase()
          .includes(keyword);

      const matchCategory =
        !categoryFilter || String(p.categoryId || "") === String(categoryFilter);

      return matchKeyword && matchCategory;
    });
  }, [list, searchKeyword, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, safeCurrentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ marginBottom: 6, color: "#0f172a", fontWeight: 700 }}>
          Quản lý sản phẩm
        </h2>
        <p style={{ marginBottom: 0, color: "#64748b" }}>
          Tạo mới, chỉnh sửa, tìm kiếm, lọc theo danh mục và phân trang sản phẩm.
        </p>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="row g-4 align-items-start">
        <div className="col-lg-4 col-xl-3">
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              position: "sticky",
              top: 20,
            }}
          >
            <h4
              style={{
                color: "#0f172a",
                fontWeight: 700,
                marginBottom: 16,
                fontSize: 28,
                lineHeight: 1.25,
              }}
            >
              {editingId ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
            </h4>

            <div className="d-grid gap-3">
              <div>
                <label className="form-label" style={labelStyle}>
                  Tên / Slug
                </label>
                <input
                  className="form-control"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="form-label" style={labelStyle}>
                  Danh mục
                </label>
                <select
                  className="form-select"
                  value={String(form.categoryId ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Chọn danh mục</option>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={labelStyle}>
                  Giá cơ bản
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm({ ...form, basePrice: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="form-label" style={labelStyle}>
                  Trạng thái
                </label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </div>

              <div className="form-check">
                <input
                  id="isFeatured"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                />
                <label
                  htmlFor="isFeatured"
                  className="form-check-label"
                  style={labelStyle}
                >
                  Sản phẩm nổi bật
                </label>
              </div>

              {!editingId && (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 12,
                      fontSize: 15,
                    }}
                  >
                    Biến thể đầu tiên khi tạo mới
                  </div>

                  <div className="d-grid gap-3">
                    <div>
                      <label className="form-label" style={labelStyle}>
                        SKU biến thể
                      </label>
                      <input
                        className="form-control"
                        value={form.firstVariant.sku}
                        onChange={(e) =>
                          updateFirstVariantField("sku", e.target.value)
                        }
                        style={inputStyle}
                        placeholder="VD: SP-001-DEFAULT"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={labelStyle}>
                        Tên biến thể
                      </label>
                      <input
                        className="form-control"
                        value={form.firstVariant.variantName}
                        onChange={(e) =>
                          updateFirstVariantField("variantName", e.target.value)
                        }
                        style={inputStyle}
                        placeholder="VD: Mặc định / Đỏ / Size M"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={labelStyle}>
                        Giá biến thể
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.firstVariant.price}
                        onChange={(e) =>
                          updateFirstVariantField("price", e.target.value)
                        }
                        style={inputStyle}
                        placeholder="Để trống sẽ lấy giá cơ bản"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={labelStyle}>
                        Tồn kho ban đầu
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.firstVariant.initialStock}
                        onChange={(e) =>
                          updateFirstVariantField("initialStock", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div className="form-check">
                      <input
                        id="firstVariantIsActive"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.firstVariant.isActive}
                        onChange={(e) =>
                          updateFirstVariantField("isActive", e.target.checked)
                        }
                      />
                      <label
                        htmlFor="firstVariantIsActive"
                        className="form-check-label"
                        style={labelStyle}
                      >
                        Biến thể đang hoạt động
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label" style={labelStyle}>
                  Ảnh sản phẩm
                </label>

                <div className="d-grid gap-2">
                  {form.imageUrls.map((url, index) => (
                    <div key={index} className="border rounded-3 p-2">
                      <div className="d-flex gap-2 align-items-start">
                        <input
                          className="form-control"
                          value={url}
                          readOnly
                          placeholder="Chưa chọn ảnh"
                          style={inputStyle}
                        />

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeImageField(index)}
                          style={{
                            borderRadius: 12,
                            minWidth: 62,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Xóa
                        </button>
                      </div>

                      <div className="mt-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="form-control"
                          onChange={(e) =>
                            handleChooseImage(index, e.target.files?.[0])
                          }
                          style={inputStyle}
                        />
                      </div>

                      {uploadingIndex === index && (
                        <div
                          className="mt-2"
                          style={{ color: "#2563eb", fontSize: 14 }}
                        >
                          Đang tải ảnh lên...
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={addImageField}
                  style={{ borderRadius: 10 }}
                >
                  + Thêm ảnh
                </button>

                <div className="mt-3 d-flex flex-wrap gap-2">
                  {form.imageUrls
                    .filter((x) => x.trim() !== "")
                    .map((url, idx) => (
                      <img
                        key={idx}
                        src={getImageSrc(url)}
                        alt={`preview-${idx}`}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ))}
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  onClick={save}
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    fontWeight: 600,
                    paddingLeft: 18,
                    paddingRight: 18,
                  }}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId
                    ? "Cập nhật"
                    : "Tạo mới"}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className="btn btn-outline-secondary"
                    style={{
                      height: 44,
                      borderRadius: 12,
                      fontWeight: 600,
                      paddingLeft: 18,
                      paddingRight: 18,
                    }}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-xl-9">
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb" }}>
              <h4
                style={{
                  marginBottom: 16,
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: 30,
                }}
              >
                Danh sách sản phẩm
              </h4>

              <div className="row g-3 align-items-end">
                <div className="col-md-6 col-xl-5">
                  <label className="form-label" style={labelStyle}>
                    Tìm kiếm sản phẩm
                  </label>
                  <input
                    className="form-control"
                    placeholder="Nhập mã, tên, danh mục hoặc trạng thái..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-3 col-xl-3">
                  <label className="form-label" style={labelStyle}>
                    Danh mục
                  </label>
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Tất cả</option>
                    {CATEGORY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 col-xl-4">
                  <div
                    style={{
                      color: "#64748b",
                      fontWeight: 500,
                      lineHeight: 1.7,
                    }}
                  >
                    Trang {safeCurrentPage} / {totalPages}
                    <br />
                    Kết quả: {filteredList.length}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">Đang tải sản phẩm...</div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>
                Không tìm thấy sản phẩm nào.
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
                        <th style={{ ...thStyle, minWidth: 70 }}>Mã</th>
                        <th style={{ ...thStyle, minWidth: 90 }}>Ảnh</th>
                        <th style={{ ...thStyle, minWidth: 220 }}>Tên</th>
                        <th
                          style={{
                            ...thStyle,
                            minWidth: 170,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Danh mục
                        </th>
                        <th style={{ ...thStyle, minWidth: 130 }}>Giá</th>
                        <th
                          style={{
                            ...thStyle,
                            minWidth: 150,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Trạng thái
                        </th>
                        <th style={{ ...thStyle, minWidth: 230 }}>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedList.map((p) => (
                        <tr key={p.id}>
                          <td style={tdStyle}>{p.id}</td>

                          <td style={tdStyle}>
                            {p.imageUrl ? (
                              <img
                                src={getImageSrc(p.imageUrl)}
                                alt={p.slug}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  borderRadius: 10,
                                }}
                              />
                            ) : (
                              <span style={{ color: "#94a3b8" }}>
                                Chưa có ảnh
                              </span>
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 600,
                              lineHeight: 1.6,
                            }}
                          >
                            {p.slug}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              minWidth: 170,
                              whiteSpace: "nowrap",
                              fontWeight: 500,
                            }}
                          >
                            {getCategoryText(p.categoryId)}
                          </td>

                          <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                            {formatPrice(p.basePrice)}
                          </td>

                          <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                            {getStatusText(p.status)}
                          </td>

                          <td style={tdStyle}>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                onClick={() => startEdit(p)}
                                className="btn btn-outline-primary btn-sm"
                                style={{ borderRadius: 10 }}
                              >
                                Sửa
                              </button>

                              <button
                                onClick={() => remove(p.id)}
                                className="btn btn-outline-danger btn-sm"
                                style={{ borderRadius: 10 }}
                              >
                                Xóa
                              </button>

                              <Link
                                to={`/admin/products/${p.id}/variants`}
                                className="btn btn-outline-success btn-sm"
                                style={{ borderRadius: 10 }}
                              >
                                Biến thể
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-3 border-top">
                  <div style={{ color: "#64748b", fontWeight: 500 }}>
                    Hiển thị tối đa {PAGE_SIZE} sản phẩm mỗi trang
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
  height: 44,
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
  verticalAlign: "middle",
};