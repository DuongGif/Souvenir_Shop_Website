import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function ProductsPage() {
  const [q, setQ] = useState({
    keyword: "",
    categoryIds: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    inStockOnly: false,
    sort: "newest",
    page: 1,
    pageSize: 12,
  });

  const [data, setData] = useState({
    items: [],
    totalItems: 0,
    page: 1,
    pageSize: 12,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const params = useMemo(() => {
    const p = { ...q };
    Object.keys(p).forEach((k) => {
      if (p[k] === "" || p[k] === null || p[k] === false) delete p[k];
    });
    return p;
  }, [q]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await productService.search(params);
        setData(res.data);
      } catch (ex) {
        setErr(ex?.response?.data || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params]);

  const totalPages = Math.max(
    1,
    Math.ceil((data.totalItems || 0) / (data.pageSize || 12))
  );

  return (
    <MainLayout>
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="section-title">
            <h2>Sản phẩm lưu niệm</h2>
            <p>
              Khám phá các sản phẩm lưu niệm dành cho khách tham quan. Bạn có thể
              tìm kiếm, lọc theo mức giá, đánh giá và sắp xếp theo nhu cầu.
            </p>
          </div>

          {err && (
            <div className="alert alert-danger mb-4" role="alert">
              {String(err)}
            </div>
          )}

          <div className="row g-4">
            {/* Sidebar filters */}
            <div className="col-lg-4 col-xl-3">
              <div
                className="p-4 rounded-4 h-100"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <h4 className="mb-3">Bộ lọc sản phẩm</h4>

                <div className="d-grid gap-3">
                  <div>
                    <label className="form-label">Từ khóa</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tên sản phẩm..."
                      value={q.keyword}
                      onChange={(e) =>
                        setQ({ ...q, keyword: e.target.value, page: 1 })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Danh mục</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: 1,2,3"
                      value={q.categoryIds}
                      onChange={(e) =>
                        setQ({ ...q, categoryIds: e.target.value, page: 1 })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Giá từ</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={q.minPrice}
                      onChange={(e) =>
                        setQ({ ...q, minPrice: e.target.value, page: 1 })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Giá đến</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="1000000"
                      value={q.maxPrice}
                      onChange={(e) =>
                        setQ({ ...q, maxPrice: e.target.value, page: 1 })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Đánh giá tối thiểu</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="5"
                      step="0.1"
                      placeholder="Ví dụ: 4"
                      value={q.minRating}
                      onChange={(e) =>
                        setQ({ ...q, minRating: e.target.value, page: 1 })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Sắp xếp</label>
                    <select
                      className="form-select"
                      value={q.sort}
                      onChange={(e) =>
                        setQ({ ...q, sort: e.target.value, page: 1 })
                      }
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="rating_desc">Đánh giá cao nhất</option>
                      <option value="rating_asc">Đánh giá thấp nhất</option>
                    </select>
                  </div>

                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="inStockOnly"
                      checked={q.inStockOnly}
                      onChange={(e) =>
                        setQ({ ...q, inStockOnly: e.target.checked, page: 1 })
                      }
                    />
                    <label className="form-check-label" htmlFor="inStockOnly">
                      Chỉ hiển thị sản phẩm còn hàng
                    </label>
                  </div>

                  <button
                    className="btn btn-outline-light mt-2"
                    onClick={() =>
                      setQ({
                        keyword: "",
                        categoryIds: "",
                        minPrice: "",
                        maxPrice: "",
                        minRating: "",
                        inStockOnly: false,
                        sort: "newest",
                        page: 1,
                        pageSize: 12,
                      })
                    }
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            {/* Product list */}
            <div className="col-lg-8 col-xl-9">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="mb-0">
                  Danh sách sản phẩm{" "}
                  <span style={{ opacity: 0.7 }}>
                    ({data.totalItems || 0} sản phẩm)
                  </span>
                </h4>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-info" role="status"></div>
                  <p className="mt-3 mb-0">Đang tải sản phẩm...</p>
                </div>
              ) : (data.items || []).length === 0 ? (
                <div
                  className="text-center p-5 rounded-4"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <h5>Không tìm thấy sản phẩm phù hợp</h5>
                  <p className="mb-0">
                    Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                  </p>
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    {(data.items || []).map((p) => (
                      <div key={p.id} className="col-md-6 col-xl-4">
                        <ProductCard p={p} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 d-flex justify-content-center">
                    <Pagination
                      page={q.page}
                      totalPages={totalPages}
                      onPrev={() =>
                        q.page > 1 && setQ({ ...q, page: q.page - 1 })
                      }
                      onNext={() =>
                        q.page < totalPages && setQ({ ...q, page: q.page + 1 })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}