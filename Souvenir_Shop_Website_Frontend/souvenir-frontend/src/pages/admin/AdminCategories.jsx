import { useCallback, useEffect, useMemo, useState } from "react";
import { adminCategoriesService } from "../../services/admin/adminCategoriesService";

const PAGE_SIZE = 5;

const initialForm = {
  slug: "",
  parentCategoryId: "",
  isVisible: true,
  translations: [
    {
      language: "vi",
      name: "",
      description: "",
    },
  ],
};

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  return fallback;
};

export default function AdminCategoriesPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(list.length / PAGE_SIZE)
  );

  const pagedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminCategoriesService.getAll();

      const data = res.data || [];

      setList(data);

      const nextPages = Math.max(
        1,
        Math.ceil(data.length / PAGE_SIZE)
      );

      setCurrentPage((prev) =>
        prev > nextPages ? nextPages : prev
      );
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          "Không thể tải danh sách danh mục"
        )
      );
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

  const updateTranslation = (field, value) => {
    setForm((prev) => ({
      ...prev,
      translations: [
        {
          ...prev.translations[0],
          [field]: value,
        },
      ],
    }));
  };

  const create = async () => {
    setErr("");
    setMsg("");

    if (!form.slug.trim()) {
      setErr("Vui lòng nhập slug.");
      return;
    }

    if (!form.translations[0].name.trim()) {
      setErr("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      setCreating(true);

      await adminCategoriesService.create({
        slug: form.slug.trim(),
        parentCategoryId:
          form.parentCategoryId === ""
            ? null
            : Number(form.parentCategoryId),
        isVisible: form.isVisible,
        translations: form.translations,
      });

      setMsg("Thêm danh mục thành công");

      setForm(initialForm);
      setCurrentPage(1);

      await load();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          "Không thể thêm danh mục"
        )
      );
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    setErr("");
    setMsg("");

    const ok = window.confirm(
      "Bạn có chắc muốn xóa danh mục này?"
    );

    if (!ok) return;

    try {
      await adminCategoriesService.remove(id);

      setMsg("Đã xóa danh mục");

      await load();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          "Không thể xóa danh mục"
        )
      );
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

return (
  <div className="admin-categories-page">
    <div className="admin-categories-header">
      <h2 className="admin-categories-title">
        Quản lý loại sản phẩm
      </h2>

      <p className="admin-categories-desc">
        Quản lý danh mục sản phẩm trong hệ thống.
      </p>
    </div>

    {err && (
      <div className="alert alert-danger">
        {err}
      </div>
    )}

    {msg && (
      <div className="alert alert-success">
        {msg}
      </div>
    )}

    <div className="row g-4">
      <div className="col-lg-4">
        <div className="admin-categories-card">
          <h4 className="mb-3">
            Thêm danh mục mới
          </h4>

          <div className="mb-3">
            <label className="form-label">
              Từ khóa
            </label>

            <input
              className="form-control"
              value={form.slug}
              onChange={(e) =>
                updateForm("slug", e.target.value)
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Danh mục cha
            </label>

            <input
              type="number"
              className="form-control"
              value={form.parentCategoryId}
              onChange={(e) =>
                updateForm(
                  "parentCategoryId",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Tên danh mục
            </label>

            <input
              className="form-control"
              value={form.translations[0].name}
              onChange={(e) =>
                updateTranslation(
                  "name",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Mô tả
            </label>

            <textarea
              rows="4"
              className="form-control"
              value={
                form.translations[0].description
              }
              onChange={(e) =>
                updateTranslation(
                  "description",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              checked={form.isVisible}
              onChange={(e) =>
                updateForm(
                  "isVisible",
                  e.target.checked
                )
              }
            />

            <label className="form-check-label">
              Hiển thị danh mục
            </label>
          </div>

          <button
            className="btn btn-primary admin-categories-submit"
            disabled={creating}
            onClick={create}
          >
            {creating
              ? "Đang thêm..."
              : "Thêm danh mục"}
          </button>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="admin-categories-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Danh sách danh mục</h4>

            <span>
              Trang {currentPage} / {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="admin-categories-loading">
              <div className="spinner-border"></div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-categories-table">
                  <thead>
                    <tr>
                      <th>Mã loại</th>
                      <th>Từ khóa</th>
                      <th>Tên</th>
                      <th>Hiển thị</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedCategories.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>

                        <td>{item.slug}</td>

                        <td>{item.name}</td>

                        <td>
                          <span
                            className={`admin-category-status ${
                              item.isVisible
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {item.isVisible
                              ? "Hiển thị"
                              : "Đã ẩn"}
                          </span>
                        </td>

                        <td>
                        <div className="d-flex gap-2">
                            <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => editCategory(item)}
                            >
                            Sửa
                            </button>

                            <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => remove(item.id)}
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

              <div className="admin-categories-footer">
                <div className="admin-categories-pagination">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      goToPage(
                        currentPage - 1
                      )
                    }
                  >
                    Trước
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      goToPage(
                        currentPage + 1
                      )
                    }
                  >
                    Sau
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

