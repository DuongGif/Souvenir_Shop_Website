import { useCallback, useEffect, useMemo, useState } from "react";
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

const API_ORIGIN = "https://localhost:7020";

const createEmptyForm = () => ({
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

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const getStatusText = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "Đang hoạt động";
  if (value === "inactive") return "Ngừng hoạt động";
  if (value === "hidden") return "Ẩn";

  return status || "Không xác định";
};

const getStatusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "active";
  if (value === "inactive") return "inactive";
  if (value === "hidden") return "hidden";

  return "unknown";
};

const getCategoryText = (categoryId) => {
  const found = CATEGORY_OPTIONS.find((item) => {
    return item.value === Number(categoryId);
  });

  return found ? found.label : "Không xác định";
};

export default function AdminProductsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, categoryFilter]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
  };

  const startEdit = async (product) => {
    setErr("");

    try {
      const imgRes = await adminProductsService.getImages(product.id);
      const imageUrls = imgRes.data || [];

      setEditingId(product.id);

      setForm({
        slug: product.slug || "",
        categoryId: product.categoryId ?? "",
        basePrice: product.basePrice ?? "",
        status: product.status || "active",
        isFeatured: !!product.isFeatured,
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

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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
    setForm((prev) => {
      const newUrls = prev.imageUrls.filter((_, i) => i !== index);

      return {
        ...prev,
        imageUrls: newUrls.length > 0 ? newUrls : [""],
      };
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

      setForm((prev) => {
        const newUrls = [...prev.imageUrls];
        newUrls[index] = uploadedUrl;

        return {
          ...prev,
          imageUrls: newUrls,
        };
      });

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
    const variant = form.firstVariant;

    if (!variant.sku.trim()) {
      setErr("SKU biến thể đầu tiên là bắt buộc");
      return false;
    }

    if (!variant.variantName.trim()) {
      setErr("Tên biến thể đầu tiên là bắt buộc");
      return false;
    }

    if (variant.price !== "" && Number(variant.price) < 0) {
      setErr("Giá biến thể không hợp lệ");
      return false;
    }

    if (variant.weightGrams !== "" && Number(variant.weightGrams) < 0) {
      setErr("Khối lượng biến thể không hợp lệ");
      return false;
    }

    if (variant.initialStock === "" || Number(variant.initialStock) < 0) {
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

    const cleanImageUrls = form.imageUrls.filter((url) => {
      return url.trim() !== "";
    });

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

        const variant = form.firstVariant;

        const productPayload = {
          slug: form.slug.trim(),
          categoryId: Number(form.categoryId),
          basePrice: Number(form.basePrice),
          status: form.status,
          isFeatured: form.isFeatured,
          images: cleanImageUrls,
          variants: [
            {
              sku: variant.sku.trim(),
              variantName: variant.variantName.trim(),
              price:
                variant.price === ""
                  ? Number(form.basePrice)
                  : Number(variant.price),
              weightGrams:
                variant.weightGrams === "" ? null : Number(variant.weightGrams),
              isActive: !!variant.isActive,
              initialStock: Number(variant.initialStock || 0),
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

    const ok = window.confirm(`Bạn có chắc muốn xóa sản phẩm #${id}?`);
    if (!ok) return;

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

    return list.filter((product) => {
      const matchKeyword =
        !keyword ||
        String(product.id || "").toLowerCase().includes(keyword) ||
        String(product.slug || "").toLowerCase().includes(keyword) ||
        String(product.categoryId || "").toLowerCase().includes(keyword) ||
        String(getCategoryText(product.categoryId) || "")
          .toLowerCase()
          .includes(keyword) ||
        String(getStatusText(product.status) || "")
          .toLowerCase()
          .includes(keyword);

      const matchCategory =
        !categoryFilter ||
        String(product.categoryId || "") === String(categoryFilter);

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <h2 className="admin-products-title">Quản lý sản phẩm</h2>

        <p className="admin-products-desc">
          Tạo mới, chỉnh sửa, tìm kiếm, lọc theo danh mục và phân trang sản phẩm.
        </p>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="row g-4 align-items-start">
        <div className="col-lg-4 col-xl-3">
          <div className="admin-products-form-card">
            <h4 className="admin-products-form-title">
              {editingId ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
            </h4>

            <div className="admin-products-form-grid">
              <div>
                <label className="form-label admin-products-label">
                  Tên / Slug
                </label>

                <input
                  className="form-control admin-products-input"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="form-label admin-products-label">
                  Danh mục
                </label>

                <select
                  className="form-select admin-products-input"
                  value={String(form.categoryId ?? "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
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
                <label className="form-label admin-products-label">
                  Giá cơ bản
                </label>

                <input
                  type="number"
                  className="form-control admin-products-input"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      basePrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="form-label admin-products-label">
                  Trạng thái
                </label>

                <select
                  className="form-select admin-products-input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
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
                    setForm((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />

                <label
                  htmlFor="isFeatured"
                  className="form-check-label admin-products-label"
                >
                  Sản phẩm nổi bật
                </label>
              </div>

              {!editingId && (
                <div className="admin-products-variant-box">
                  <div className="admin-products-variant-title">
                    Biến thể đầu tiên khi tạo mới
                  </div>

                  <div className="admin-products-form-grid">
                    <div>
                      <label className="form-label admin-products-label">
                        SKU biến thể
                      </label>

                      <input
                        className="form-control admin-products-input"
                        value={form.firstVariant.sku}
                        onChange={(e) =>
                          updateFirstVariantField("sku", e.target.value)
                        }
                        placeholder="VD: SP-001-DEFAULT"
                      />
                    </div>

                    <div>
                      <label className="form-label admin-products-label">
                        Tên biến thể
                      </label>

                      <input
                        className="form-control admin-products-input"
                        value={form.firstVariant.variantName}
                        onChange={(e) =>
                          updateFirstVariantField(
                            "variantName",
                            e.target.value
                          )
                        }
                        placeholder="VD: Mặc định / Đỏ / Size M"
                      />
                    </div>

                    <div>
                      <label className="form-label admin-products-label">
                        Giá biến thể
                      </label>

                      <input
                        type="number"
                        className="form-control admin-products-input"
                        value={form.firstVariant.price}
                        onChange={(e) =>
                          updateFirstVariantField("price", e.target.value)
                        }
                        placeholder="Để trống sẽ lấy giá cơ bản"
                      />
                    </div>

                    <div>
                      <label className="form-label admin-products-label">
                        Tồn kho ban đầu
                      </label>

                      <input
                        type="number"
                        className="form-control admin-products-input"
                        value={form.firstVariant.initialStock}
                        onChange={(e) =>
                          updateFirstVariantField(
                            "initialStock",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-check">
                      <input
                        id="firstVariantIsActive"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.firstVariant.isActive}
                        onChange={(e) =>
                          updateFirstVariantField(
                            "isActive",
                            e.target.checked
                          )
                        }
                      />

                      <label
                        htmlFor="firstVariantIsActive"
                        className="form-check-label admin-products-label"
                      >
                        Biến thể đang hoạt động
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label admin-products-label">
                  Ảnh sản phẩm
                </label>

                <div className="admin-products-image-list">
                  {form.imageUrls.map((url, index) => (
                    <div key={index} className="admin-products-image-field">
                      <div className="admin-products-image-row">
                        <input
                          className="form-control admin-products-input"
                          value={url}
                          readOnly
                          placeholder="Chưa chọn ảnh"
                        />

                        <button
                          type="button"
                          className="btn btn-outline-danger admin-products-remove-image-btn"
                          onClick={() => removeImageField(index)}
                        >
                          Xóa
                        </button>
                      </div>

                      <div className="mt-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="form-control admin-products-input"
                          onChange={(e) =>
                            handleChooseImage(index, e.target.files?.[0])
                          }
                        />
                      </div>

                      {uploadingIndex === index && (
                        <div className="admin-products-uploading">
                          Đang tải ảnh lên...
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm admin-products-add-image-btn"
                  onClick={addImageField}
                >
                  + Thêm ảnh
                </button>

                <div className="admin-products-preview-list">
                  {form.imageUrls
                    .filter((url) => url.trim() !== "")
                    .map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        src={getImageSrc(url)}
                        alt={`preview-${index}`}
                        className="admin-products-preview-img"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ))}
                </div>
              </div>

              <div className="admin-products-form-actions">
                <button
                  type="button"
                  onClick={save}
                  className="btn btn-primary admin-products-main-btn"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-outline-secondary admin-products-main-btn"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-xl-9">
          <div className="admin-products-list-card">
            <div className="admin-products-list-head">
              <h4 className="admin-products-list-title">
                Danh sách sản phẩm
              </h4>

              <div className="row g-3 align-items-end">
                <div className="col-md-6 col-xl-5">
                  <label className="form-label admin-products-label">
                    Tìm kiếm sản phẩm
                  </label>

                  <input
                    className="form-control admin-products-input"
                    placeholder="Nhập mã, tên, danh mục hoặc trạng thái..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>

                <div className="col-md-3 col-xl-3">
                  <label className="form-label admin-products-label">
                    Danh mục
                  </label>

                  <select
                    className="form-select admin-products-input"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
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
                  <div className="admin-products-list-meta">
                    Trang {safeCurrentPage} / {totalPages}
                    <br />
                    Kết quả: {filteredList.length}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-products-loading">Đang tải sản phẩm...</div>
            ) : filteredList.length === 0 ? (
              <div className="admin-products-empty">
                Không tìm thấy sản phẩm nào.
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-products-table">
                    <thead>
                      <tr>
                        <th className="admin-products-th-id">Mã</th>
                        <th className="admin-products-th-image">Ảnh</th>
                        <th className="admin-products-th-name">Tên</th>
                        <th className="admin-products-th-category">
                          Danh mục
                        </th>
                        <th className="admin-products-th-price">Giá</th>
                        <th className="admin-products-th-status">
                          Trạng thái
                        </th>
                        <th className="admin-products-th-actions">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedList.map((product) => (
                        <tr key={product.id}>
                          <td>{product.id}</td>

                          <td>
                            {product.imageUrl ? (
                              <img
                                src={getImageSrc(product.imageUrl)}
                                alt={product.slug}
                                className="admin-products-table-image"
                              />
                            ) : (
                              <span className="admin-products-no-image">
                                Chưa có ảnh
                              </span>
                            )}
                          </td>

                          <td className="admin-products-name">
                            {product.slug}
                          </td>

                          <td className="admin-products-category">
                            {getCategoryText(product.categoryId)}
                          </td>

                          <td className="admin-products-nowrap">
                            {formatPrice(product.basePrice)}
                          </td>

                          <td className="admin-products-nowrap">
                            <span
                              className={`admin-products-status ${getStatusClass(
                                product.status
                              )}`}
                            >
                              {getStatusText(product.status)}
                            </span>
                          </td>

                          <td>
                            <div className="admin-products-action-list">
                              <button
                                type="button"
                                onClick={() => startEdit(product)}
                                className="btn btn-outline-primary btn-sm admin-products-action-btn"
                              >
                                Sửa
                              </button>

                              <button
                                type="button"
                                onClick={() => remove(product.id)}
                                className="btn btn-outline-danger btn-sm admin-products-action-btn"
                              >
                                Xóa
                              </button>

                              <Link
                                to={`/admin/products/${product.id}/variants`}
                                className="btn btn-outline-success btn-sm admin-products-action-btn"
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

                <div className="admin-products-footer">
                  <div className="admin-products-limit-text">
                    Hiển thị tối đa {PAGE_SIZE} sản phẩm mỗi trang
                  </div>

                  <div className="admin-products-pagination">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm admin-products-page-btn"
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
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
                        className={`btn btn-sm admin-products-page-btn ${
                          safeCurrentPage === page
                            ? "active"
                            : "btn-outline-primary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm admin-products-page-btn"
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
      </div>
    </div>
  );
}