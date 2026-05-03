import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

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

const toPositiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const buildQueryFromSearchParams = (searchParams) => ({
  keyword: searchParams.get("keyword") || "",
  categoryIds: searchParams.get("categoryIds") || "",
  minPrice: searchParams.get("minPrice") || "",
  maxPrice: searchParams.get("maxPrice") || "",
  minRating: searchParams.get("minRating") || "",
  inStockOnly: searchParams.get("inStockOnly") === "true",
  sort: searchParams.get("sort") || "newest",
  page: toPositiveNumber(searchParams.get("page"), 1),
  pageSize: toPositiveNumber(searchParams.get("pageSize"), 6),
});

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const sortOptions = useMemo(
    () => [
      { value: "newest", label: t.sortNewest || "Mới nhất" },
      { value: "price_asc", label: t.sortPriceAsc || "Giá tăng dần" },
      { value: "price_desc", label: t.sortPriceDesc || "Giá giảm dần" },
      { value: "rating_desc", label: t.sortRatingDesc || "Đánh giá cao nhất" },
      { value: "rating_asc", label: t.sortRatingAsc || "Đánh giá thấp nhất" },
    ],
    [t]
  );

  const categoryOptions = useMemo(
    () => [
      {
        id: "1",
        label: t.categorySouvenir || "Quà lưu niệm",
        icon: "bi bi-gift",
      },
      {
        id: "2",
        label: t.categoryHandmade || "Đồ thủ công",
        icon: "bi bi-palette",
      },
      {
        id: "3",
        label: t.categoryKeychain || "Móc khóa",
        icon: "bi bi-key",
      },
      {
        id: "4",
        label: t.categoryTravelShirt || "Áo du lịch",
        icon: "bi bi-handbag",
      },
      {
        id: "5",
        label: t.categoryAccessories || "Phụ kiện",
        icon: "bi bi-stars",
      },
      {
        id: "6",
        label: t.categorySpecialties || "Đặc sản",
        icon: "bi bi-box-seam",
      },
      {
        id: "7",
        label: t.categoryOther || "Khác",
        icon: "bi bi-three-dots",
      },
    ],
    [t]
  );

  const [q, setQ] = useState(() => buildQueryFromSearchParams(searchParams));

  const [data, setData] = useState({
    items: [],
    totalItems: 0,
    page: 1,
    pageSize: 6,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setQ(buildQueryFromSearchParams(searchParams));
  }, [searchParams]);

  const params = useMemo(() => {
    const p = { ...q };

    Object.keys(p).forEach((key) => {
      if (p[key] === "" || p[key] === null || p[key] === false) {
        delete p[key];
      }
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
        setErr(
          getErrorMessage(
            ex,
            t.productsLoadFailed || "Không thể tải danh sách sản phẩm"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params, t.productsLoadFailed]);

  useEffect(() => {
    const nextParams = {};

    if (q.keyword) nextParams.keyword = q.keyword;
    if (q.categoryIds) nextParams.categoryIds = q.categoryIds;
    if (q.minPrice) nextParams.minPrice = q.minPrice;
    if (q.maxPrice) nextParams.maxPrice = q.maxPrice;
    if (q.minRating) nextParams.minRating = q.minRating;
    if (q.inStockOnly) nextParams.inStockOnly = "true";
    if (q.sort) nextParams.sort = q.sort;
    if (q.page && q.page !== 1) nextParams.page = String(q.page);
    if (q.pageSize && q.pageSize !== 6) {
      nextParams.pageSize = String(q.pageSize);
    }

    setSearchParams(nextParams, { replace: true });
  }, [q, setSearchParams]);

  const totalPages = Math.max(
    1,
    Math.ceil((data.totalItems || 0) / (data.pageSize || 6))
  );

  const selectedCategory = categoryOptions.find(
    (item) => item.id === q.categoryIds
  );

  const updateFilter = (changes) => {
    setQ((prev) => ({
      ...prev,
      ...changes,
      page: 1,
    }));
  };

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

  const toggleCategory = (categoryId) => {
    setQ((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds === categoryId ? "" : categoryId,
      page: 1,
    }));
  };

  return (
    <MainLayout>
      <section className="section products-page-section">
        <div className="container">
          <div className="products-card products-header-card">
            <div className="products-header-top">
              <div>
                <div className="products-kicker">
                  {t.shopName || "SouVN Shop"}
                </div>

                <h2 className="products-title">
                  {t.productList || "Danh sách sản phẩm"}
                </h2>
              </div>

              <div className="products-total">
                {t.totalProducts || "Tổng số sản phẩm:"}{" "}
                <span className="products-total-number">
                  {data.totalItems || 0}
                </span>
              </div>
            </div>
          </div>

          {err && (
            <div className="products-alert" role="alert">
              {String(err)}
            </div>
          )}

          <div className="row g-4 align-items-start">
            <div className="col-lg-3">
              <div className="products-card products-filter-card">
                <div className="products-filter-title">
                  <i className="bi bi-funnel me-2"></i>
                  {t.searchFilters || "Bộ lọc tìm kiếm"}
                </div>

                <div className="d-grid gap-3">
                  <div>
                    <label className="form-label products-form-label">
                      {t.keyword || "Từ khóa"}
                    </label>

                    <input
                      type="text"
                      className="form-control products-input"
                      placeholder={t.enterProductName || "Nhập tên sản phẩm..."}
                      value={q.keyword}
                      onChange={(e) =>
                        updateFilter({ keyword: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label products-form-label">
                      {t.category || "Danh mục"}
                    </label>

                    <div className="products-category-list">
                      {categoryOptions.map((item) => {
                        const isActive = q.categoryIds === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleCategory(item.id)}
                            className={`products-category-button ${
                              isActive ? "active" : ""
                            }`}
                          >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedCategory && (
                      <div className="products-selected-category">
                        {t.selected || "Đang chọn:"}{" "}
                        <span>{selectedCategory.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label products-form-label">
                        {t.priceFrom || "Giá từ"}
                      </label>

                      <input
                        type="number"
                        className="form-control products-input"
                        placeholder="0"
                        min="0"
                        value={q.minPrice}
                        onChange={(e) =>
                          updateFilter({ minPrice: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label products-form-label">
                        {t.priceTo || "Giá đến"}
                      </label>

                      <input
                        type="number"
                        className="form-control products-input"
                        placeholder="1000000"
                        min="0"
                        value={q.maxPrice}
                        onChange={(e) =>
                          updateFilter({ maxPrice: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label products-form-label">
                      {t.minRating || "Đánh giá tối thiểu"}
                    </label>

                    <input
                      type="number"
                      className="form-control products-input"
                      min="0"
                      max="5"
                      step="0.1"
                      placeholder={t.minRatingExample || "Ví dụ: 4"}
                      value={q.minRating}
                      onChange={(e) =>
                        updateFilter({ minRating: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-check products-stock-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="inStockOnly"
                      checked={q.inStockOnly}
                      onChange={(e) =>
                        updateFilter({ inStockOnly: e.target.checked })
                      }
                    />

                    <label
                      className="form-check-label products-stock-label"
                      htmlFor="inStockOnly"
                    >
                      {t.inStockOnly || "Chỉ hiển thị sản phẩm còn hàng"}
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn products-clear-button"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    {t.clearFilters || "Xóa bộ lọc"}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="products-card products-toolbar-card">
                <div className="products-toolbar-inner">
                  <div className="products-sort-group">
                    <span className="products-sort-label">
                      {t.sortBy || "Sắp xếp theo"}
                    </span>

                    {sortOptions.map((option) => {
                      const isActive = q.sort === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateFilter({ sort: option.value })}
                          className={`products-sort-button ${
                            isActive ? "active" : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="products-count">
                    {t.showing || "Hiển thị"}{" "}
                    <span>{data.items?.length || 0}</span>{" "}
                    {t.products || "sản phẩm"}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="products-card products-loading-card">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="products-loading-text">
                    {t.loadingProducts || "Đang tải sản phẩm..."}
                  </p>
                </div>
              ) : (data.items || []).length === 0 ? (
                <div className="products-card products-empty-card">
                  <div className="products-empty-icon">
                    <i className="bi bi-search"></i>
                  </div>

                  <h4 className="products-empty-title">
                    {t.noMatchingProducts || "Không tìm thấy sản phẩm phù hợp"}
                  </h4>

                  <p className="products-empty-text">
                    {t.tryDifferentFilters ||
                      "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."}
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

                  <div className="products-pagination-wrap">
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