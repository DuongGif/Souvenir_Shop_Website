import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import heroImg from "../assets/img/profile/VN.jpg";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
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

export default function HomePage() {
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productErr, setProductErr] = useState("");

  const categories = useMemo(
    () => [
      {
        icon: "bi bi-gift",
        text: t.categorySouvenir || "Quà lưu niệm",
        categoryIds: "1",
      },
      {
        icon: "bi bi-palette",
        text: t.categoryHandmade || "Đồ thủ công",
        categoryIds: "2",
      },
      {
        icon: "bi bi-key",
        text: t.categoryKeychain || "Móc khóa",
        categoryIds: "3",
      },
      {
        icon: "bi bi-handbag",
        text: t.categoryTravelShirt || "Áo du lịch",
        categoryIds: "4",
      },
      {
        icon: "bi bi-stars",
        text: t.categoryAccessories || "Phụ kiện",
        categoryIds: "5",
      },
      {
        icon: "bi bi-box-seam",
        text: t.categorySpecialties || "Đặc sản",
        categoryIds: "6",
      },
    ],
    [t]
  );

  const reasons = useMemo(
    () => [
      {
        icon: "bi bi-grid",
        title: t.reasonDiverseTitle || "Sản phẩm đa dạng",
        desc:
          t.reasonDiverseDesc ||
          "Nhiều lựa chọn quà tặng và đồ lưu niệm phù hợp cho khách tham quan.",
      },
      {
        icon: "bi bi-cash-coin",
        title: t.reasonPriceTitle || "Giá cả hợp lý",
        desc:
          t.reasonPriceDesc ||
          "Mức giá rõ ràng, phù hợp với nhiều nhu cầu mua sắm khác nhau.",
      },
      {
        icon: "bi bi-truck",
        title: t.reasonDeliveryTitle || "Giao hàng nhanh",
        desc:
          t.reasonDeliveryDesc ||
          "Hỗ trợ xử lý đơn hàng nhanh chóng và thuận tiện cho khách hàng.",
      },
      {
        icon: "bi bi-credit-card",
        title: t.reasonPaymentTitle || "Thanh toán tiện lợi",
        desc:
          t.reasonPaymentDesc ||
          "Nhiều hình thức thanh toán giúp quá trình mua hàng dễ dàng hơn.",
      },
    ],
    [t]
  );

  const heroTags = useMemo(
    () => [
      t.heroTag1 || "Quà lưu niệm đẹp",
      t.heroTag2 || "Mua sắm dễ dàng",
      t.heroTag3 || "Nhiều sản phẩm",
      t.heroTag4 || "Trải nghiệm tốt",
    ],
    [t]
  );

  useEffect(() => {
    const loadHomeProducts = async () => {
      setLoadingProducts(true);
      setProductErr("");

      try {
        const res = await productService.search({
          page: 1,
          pageSize: 12,
          sort: "newest",
        });

        const items = Array.isArray(res?.data?.items) ? res.data.items : [];

        setFeaturedProducts(items.slice(0, 6));
        setNewProducts(items.slice(6, 12));
      } catch (ex) {
        setProductErr(
          getErrorMessage(
            ex,
            t.homeProductsLoadFailed || "Không thể tải sản phẩm trang chủ."
          )
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadHomeProducts();
  }, [t.homeProductsLoadFailed]);

  return (
    <MainLayout>
      <main className="main page-main">
        <div className="container">
          {/* HERO */}
          <section className="home-section">
            <div className="home-card">
              <div className="row g-0 align-items-center">
                <div className="col-lg-6">
                  <div className="home-hero-content">
                    <div className="section-subtitle">
                      {t.homeWelcome || "Chào mừng đến với "}
                    </div>

                    <h1 className="home-hero-title">
                     
                      <span>{t.homeHeroHighlight || "SouVN Shop"}</span>{" "}
                      
                    </h1>

                    <p className="home-hero-desc">
                      {t.homeHeroDesc ||
                        "Khám phá hàng ngàn sản phẩm lưu niệm độc đáo dành cho khách du lịch và khách tham quan. Tìm kiếm, chọn mua và đặt hàng nhanh chóng trên SouVN với giao diện hiện đại, dễ sử dụng."}
                    </p>

                    <div className="home-hero-actions">
                      <Link to="/products" className="btn-main">
                        <i className="bi bi-bag-heart"></i>
                        {t.buyNow || "Mua ngay"}
                      </Link>

                      <Link to="/contact" className="btn-outline-main">
                        <i className="bi bi-telephone"></i>
                        {t.contact || "Liên hệ"}
                      </Link>
                    </div>

                    <div className="home-hero-tags">
                      {heroTags.map((text, index) => (
                        <div key={index} className="home-hero-tag">
                          <i className="bi bi-check-circle"></i>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="home-hero-image-area">
                    <div className="home-hero-image-box">
                      <img
                        src={heroImg}
                        alt="SouVN Shop"
                        className="img-fluid home-hero-img"
                      />

                      <div className="home-floating-badge badge-top-left">
                        <i className="bi bi-gift"></i>
                        <span>{t.heroBadgeSouvenir || "Lưu niệm"}</span>
                      </div>

                      <div className="home-floating-badge badge-middle-right">
                        <i className="bi bi-cart-check"></i>
                        <span>{t.heroBadgeShopping || "Mua sắm"}</span>
                      </div>

                      <div className="home-floating-badge badge-bottom-left">
                        <i className="bi bi-globe"></i>
                        <span>{t.heroBadgeVisitor || "Khách tham quan"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DANH MỤC */}
          <section className="home-section">
            <div className="home-card-inner">
              <div className="home-section-header">
                <div className="section-subtitle">
                  {t.shopByGroup || "Mua sắm theo nhóm"}
                </div>
                <h2 className="section-title">
                  {t.featuredCategories || "Danh mục nổi bật"}
                </h2>
              </div>

              <div className="row g-3">
                {categories.map((item, index) => (
                  <div key={index} className="col-6 col-md-4 col-lg-2">
                    <Link
                      to={`/products?categoryIds=${item.categoryIds}`}
                      className="home-category-card"
                    >
                      <div className="home-category-icon">
                        <i className={item.icon}></i>
                      </div>

                      <div className="home-category-name">{item.text}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SẢN PHẨM NỔI BẬT */}
          <section className="home-section">
            <div className="home-card-inner">
              <div className="home-section-header-flex">
                <div>
                  <div className="section-subtitle">
                    {t.suggestedForYou || "Gợi ý cho bạn"}
                  </div>
                  <h2 className="section-title">
                    {t.featuredProducts || "Sản phẩm nổi bật"}
                  </h2>
                </div>

                <Link to="/products" className="home-view-all">
                  {t.viewAll || "Xem tất cả"}
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {productErr && (
                <div className="home-alert-error" role="alert">
                  {productErr}
                </div>
              )}

              {loadingProducts ? (
                <div className="home-loading">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="home-loading-text">
                    {t.loadingProducts || "Đang tải sản phẩm..."}
                  </p>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="home-empty-state">
                  {t.noProductsToShow || "Hiện chưa có sản phẩm để hiển thị."}
                </div>
              ) : (
                <div className="row g-3">
                  {featuredProducts.map((p) => (
                    <div key={p.id} className="col-sm-6 col-lg-4">
                      <ProductCard p={p} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SẢN PHẨM MỚI */}
          <section className="home-section">
            <div className="home-card-inner">
              <div className="home-section-header-flex">
                <div>
                  <div className="section-subtitle">
                    {t.recentUpdates || "Cập nhật gần đây"}
                  </div>
                  <h2 className="section-title">
                    {t.newProducts || "Sản phẩm mới"}
                  </h2>
                </div>

                <Link to="/products" className="home-view-all">
                  {t.viewAll || "Xem tất cả"}
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {loadingProducts ? (
                <div className="home-loading">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="home-loading-text">
                    {t.loadingNewProducts || "Đang tải sản phẩm mới..."}
                  </p>
                </div>
              ) : newProducts.length === 0 ? (
                <div className="home-empty-state">
                  {t.noNewProducts || "Hiện chưa có sản phẩm mới để hiển thị."}
                </div>
              ) : (
                <div className="row g-3">
                  {newProducts.map((p) => (
                    <div key={p.id} className="col-sm-6 col-lg-4">
                      <ProductCard p={p} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* LÝ DO CHỌN SOUVN */}
          <section>
            <div className="home-card-inner">
              <div className="home-section-header">
                <div className="section-subtitle">
                  {t.ourCommitment || "Cam kết của chúng tôi"}
                </div>
                <h2 className="section-title">
                  {t.whyChooseSouVN || "Vì sao chọn SouVN?"}
                </h2>
              </div>

              <div className="row g-3">
                {reasons.map((item, index) => (
                  <div key={index} className="col-md-6 col-lg-3">
                    <div className="home-reason-card">
                      <div className="home-reason-icon">
                        <i className={item.icon}></i>
                      </div>

                      <div className="home-reason-title">{item.title}</div>

                      <div className="home-reason-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}