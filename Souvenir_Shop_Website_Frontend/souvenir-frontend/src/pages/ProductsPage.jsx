import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const inputStyle = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  boxShadow: "none",
};

const labelStyle = {
  color: "#374151",
  fontWeight: 700,
  marginBottom: 8,
  fontSize: 14,
};

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "rating_desc", label: "Đánh giá cao nhất" },
  { value: "rating_asc", label: "Đánh giá thấp nhất" },
];

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
    pageSize: 6,
  });

  const [data, setData] = useState({
    items: [],
    totalItems: 0,
    page: 1,
    pageSize: 6,
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
        setData(
          res?.data || {
            items: [],
            totalItems: 0,
            page: 1,
            pageSize: 6,
          }
        );
      } catch (ex) {
        const message =
          typeof ex?.response?.data === "string"
            ? ex.response.data
            : ex?.response?.data?.message ||
              ex?.response?.data?.title ||
              "Không thể tải danh sách sản phẩm";
        setErr(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params]);

  const totalPages = Math.max(
    1,
    Math.ceil((data.totalItems || 0) / (data.pageSize || 6))
  );

  const clearFilters = () => {
    setQ({
      keyword: "",
      categoryIds: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      inStockOnly: false,
      sort: "newest",
      page: 1,
      pageSize: 6,
    });
  };

  return (
    <MainLayout>
      <section
        className="section"
        style={{
          background: "#f5f5f5",
          minHeight: "100vh",
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <div className="container">
          <div
            style={{
              ...pageCard,
              padding: 24,
              marginBottom: 20,
              borderLeft: "5px solid #ee4d2d",
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  SouVN Shop
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  Danh sách sản phẩm
                </h2>
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                Tổng số sản phẩm:{" "}
                <span style={{ color: "#ee4d2d" }}>{data.totalItems || 0}</span>
              </div>
            </div>
          </div>

          {err && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 12,
              }}
            >
              {String(err)}
            </div>
          )}

          <div className="row g-4 align-items-start">
            <div className="col-lg-3">
              <div style={{ ...pageCard, padding: 20, position: "sticky", top: 24 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 18,
                  }}
                >
                  <i className="bi bi-funnel me-2" style={{ color: "#ee4d2d" }}></i>
                  Bộ lọc tìm kiếm
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

                  <div className="row g-2">
                    <div className="col-6">
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

                    <div className="col-6">
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

                  <div
                    className="form-check"
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      borderRadius: 12,
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
                      style={{ color: "#9a3412", fontWeight: 600 }}
                    >
                      Chỉ hiển thị sản phẩm còn hàng
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={clearFilters}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 700,
                      background: "#ee4d2d",
                      color: "#fff",
                      border: "none",
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div style={{ ...pageCard, padding: 20, marginBottom: 16 }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "#6b7280",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Sắp xếp theo
                    </span>

                    {sortOptions.map((option) => {
                      const isActive = q.sort === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setQ({ ...q, sort: option.value, page: 1 })
                          }
                          style={{
                            border: "none",
                            outline: "none",
                            background: isActive ? "#ee4d2d" : "#fff",
                            color: isActive ? "#fff" : "#374151",
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: "10px 16px",
                            whiteSpace: "nowrap",
                            boxShadow: isActive
                              ? "0 8px 18px rgba(238,77,45,0.2)"
                              : "inset 0 0 0 1px #e5e7eb",
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Hiển thị{" "}
                    <span style={{ color: "#ee4d2d" }}>
                      {data.items?.length || 0}
                    </span>{" "}
                    sản phẩm
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ ...pageCard, padding: 40 }} className="text-center">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                    Đang tải sản phẩm...
                  </p>
                </div>
              ) : (data.items || []).length === 0 ? (
                <div style={{ ...pageCard, padding: 40 }} className="text-center">
                  <div
                    style={{
                      fontSize: 54,
                      color: "#d1d5db",
                      marginBottom: 12,
                    }}
                  >
                    <i className="bi bi-search"></i>
                  </div>

                  <h4 style={{ color: "#111827", fontWeight: 700 }}>
                    Không tìm thấy sản phẩm phù hợp
                  </h4>

                  <p style={{ color: "#6b7280", marginBottom: 0 }}>
                    Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                  </p>
                </div>
              ) : (
                <>
                  <div className="row g-3">
                    {(data.items || []).map((p) => (
                      <div key={p.id} className="col-sm-6 col-lg-4">
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