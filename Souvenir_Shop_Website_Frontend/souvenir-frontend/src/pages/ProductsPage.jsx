import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

const panelStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 24,
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
  backdropFilter: "blur(6px)",
};

const inputStyle = {
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#e2e8f0",
  boxShadow: "none",
};

const labelStyle = {
  color: "#cbd5e1",
  fontWeight: 600,
  marginBottom: 8,
};

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
      <section
        className="section"
        style={{
          background:
            "radial-gradient(circle at top center, rgba(56,189,248,0.10), transparent 24%), linear-gradient(180deg, #04131f 0%, #071a29 60%, #0a1f31 100%)",
          paddingTop: 50,
          paddingBottom: 60,
        }}
      >
        <div className="container" data-aos="fade-up">
          <div
            className="text-center mb-5"
            style={{
              paddingTop: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(56,189,248,0.12)",
                color: "#38bdf8",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 24,
                border: "1px solid rgba(56,189,248,0.18)",
                boxShadow: "0 10px 30px rgba(13,110,253,0.15)",
              }}
            >
              <i className="bi bi-bag-heart-fill"></i>
              Sản phẩm lưu niệm SouVN
            </span>

            <h2
              style={{
                fontWeight: 800,
                marginBottom: 20,
                color: "#f8fafc",
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                textShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
            >
              Khám phá bộ sưu tập quà lưu niệm
            </h2>

            <p
              style={{
                maxWidth: 860,
                margin: "0 auto",
                color: "rgba(226,232,240,0.86)",
                lineHeight: 1.9,
                fontSize: 18,
              }}
            >
              Tìm kiếm, lọc theo mức giá, đánh giá và sắp xếp sản phẩm theo nhu
              cầu để chọn được món quà lưu niệm phù hợp nhất dành cho bạn.
            </p>
          </div>

          {err && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 16,
              }}
            >
              {String(err)}
            </div>
          )}

          <div className="row g-4 align-items-start">
            <div className="col-lg-4 col-xl-3">
              <div style={{ ...panelStyle, padding: 24 }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4
                    className="mb-0"
                    style={{ color: "#f8fafc", fontWeight: 700 }}
                  >
                    Bộ lọc sản phẩm
                  </h4>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#7dd3fc",
                      background: "rgba(56,189,248,0.10)",
                      border: "1px solid rgba(56,189,248,0.16)",
                      padding: "6px 10px",
                      borderRadius: 999,
                    }}
                  >
                    Tùy chọn
                  </span>
                </div>

                <div className="d-grid gap-3">
                  <div>
                    <label className="form-label" style={labelStyle}>
                      Từ khóa
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tên sản phẩm..."
                      value={q.keyword}
                      onChange={(e) =>
                        setQ({ ...q, keyword: e.target.value, page: 1 })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={labelStyle}>
                      Danh mục
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: 1,2,3"
                      value={q.categoryIds}
                      onChange={(e) =>
                        setQ({ ...q, categoryIds: e.target.value, page: 1 })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={labelStyle}>
                      Giá từ
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={q.minPrice}
                      onChange={(e) =>
                        setQ({ ...q, minPrice: e.target.value, page: 1 })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={labelStyle}>
                      Giá đến
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="1000000"
                      value={q.maxPrice}
                      onChange={(e) =>
                        setQ({ ...q, maxPrice: e.target.value, page: 1 })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={labelStyle}>
                      Đánh giá tối thiểu
                    </label>
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
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={labelStyle}>
                      Sắp xếp
                    </label>
                    <select
                      className="form-select"
                      value={q.sort}
                      onChange={(e) =>
                        setQ({ ...q, sort: e.target.value, page: 1 })
                      }
                      style={inputStyle}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="rating_desc">Đánh giá cao nhất</option>
                      <option value="rating_asc">Đánh giá thấp nhất</option>
                    </select>
                  </div>

                  <div
                    className="form-check mt-1"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "12px 14px 12px 38px",
                    }}
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="inStockOnly"
                      checked={q.inStockOnly}
                      onChange={(e) =>
                        setQ({ ...q, inStockOnly: e.target.checked, page: 1 })
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="inStockOnly"
                      style={{ color: "#e2e8f0" }}
                    >
                      Chỉ hiển thị sản phẩm còn hàng
                    </label>
                  </div>

                  <button
                    className="btn mt-2"
                    style={{
                      borderRadius: 14,
                      height: 48,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.04)",
                    }}
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
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-8 col-xl-9">
              <div
                style={{
                  ...panelStyle,
                  padding: 24,
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h4
                    className="mb-0"
                    style={{ color: "#f8fafc", fontWeight: 700 }}
                  >
                    Danh sách sản phẩm{" "}
                    <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                      ({data.totalItems || 0} sản phẩm)
                    </span>
                  </h4>

                  <div
                    style={{
                      color: "#7dd3fc",
                      fontSize: 14,
                      background: "rgba(56,189,248,0.10)",
                      border: "1px solid rgba(56,189,248,0.16)",
                      padding: "8px 12px",
                      borderRadius: 999,
                    }}
                  >
                    <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                    Hiển thị {data.items?.length || 0} sản phẩm
                  </div>
                </div>

                {loading ? (
                  <div
                    className="text-center py-5"
                    style={{
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="spinner-border text-info" role="status"></div>
                    <p className="mt-3 mb-0" style={{ color: "#cbd5e1" }}>
                      Đang tải sản phẩm...
                    </p>
                  </div>
                ) : (data.items || []).length === 0 ? (
                  <div
                    className="text-center p-5"
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        margin: "0 auto 16px auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(56,189,248,0.10)",
                        color: "#7dd3fc",
                        fontSize: 28,
                      }}
                    >
                      <i className="bi bi-search"></i>
                    </div>
                    <h5 style={{ color: "#f8fafc", fontWeight: 700 }}>
                      Không tìm thấy sản phẩm phù hợp
                    </h5>
                    <p className="mb-0" style={{ color: "#94a3b8" }}>
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
        </div>
      </section>
    </MainLayout>
  );
}