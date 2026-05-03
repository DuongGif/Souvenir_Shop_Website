import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import heroImg from "../assets/img/profile/profile-square-11.webp";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const pageCard = {
  background: "#ffffff",
  borderRadius: 24,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const sectionTitle = {
  fontSize: "clamp(22px, 4vw, 32px)",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const sectionSubTitle = {
  fontSize: 14,
  color: "#6b7280",
  fontWeight: 600,
  marginBottom: 8,
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
      <main
        className="main"
        style={{
          background: "#f5f5f5",
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <div className="container">
          <section style={{ marginBottom: 28 }}>
            <div
              style={{
                ...pageCard,
                overflow: "hidden",
              }}
            >
              <div className="row g-0 align-items-center">
                <div className="col-lg-6">
                  <div style={{ padding: "42px 34px" }}>
                    <div style={sectionSubTitle}>
                      {t.homeWelcome || "Chào mừng đến với SouVN Shop"}
                    </div>

                    <h1
                      style={{
                        fontSize: "clamp(30px, 5vw, 50px)",
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: "#111827",
                        marginBottom: 16,
                      }}
                    >
                      {t.homeHeroPrefix || "Website bán"}{" "}
                      <span style={{ color: "#ee4d2d" }}>
                        {t.homeHeroHighlight || "đồ lưu niệm"}
                      </span>{" "}
                      {t.homeHeroSuffix || "cho khách tham quan"}
                    </h1>

                    <p
                      style={{
                        color: "#4b5563",
                        fontSize: 16,
                        lineHeight: 1.8,
                        marginBottom: 24,
                        maxWidth: 560,
                      }}
                    >
                      {t.homeHeroDesc ||
                        "Khám phá hàng ngàn sản phẩm lưu niệm độc đáo dành cho khách du lịch và khách tham quan. Tìm kiếm, chọn mua và đặt hàng nhanh chóng trên SouVN với giao diện hiện đại, dễ sử dụng."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 24,
                      }}
                    >
                      <Link
                        to="/products"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 20px",
                          borderRadius: 12,
                          background: "#ee4d2d",
                          color: "#ffffff",
                          textDecoration: "none",
                          fontWeight: 700,
                          boxShadow: "0 8px 18px rgba(238,77,45,0.2)",
                        }}
                      >
                        <i className="bi bi-bag-heart"></i>
                        {t.buyNow || "Mua ngay"}
                      </Link>

                      <Link
                        to="/contact"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 20px",
                          borderRadius: 12,
                          background: "#ffffff",
                          color: "#ee4d2d",
                          textDecoration: "none",
                          fontWeight: 700,
                          border: "1px solid #ee4d2d",
                        }}
                      >
                        <i className="bi bi-telephone"></i>
                        {t.contact || "Liên hệ"}
                      </Link>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      {heroTags.map((text, index) => (
                        <div
                          key={index}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "#fff7ed",
                            color: "#c2410c",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <i className="bi bi-check-circle"></i>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div
                    style={{
                      position: "relative",
                      background:
                        "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%, #fef2f2 100%)",
                      minHeight: 520,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 430,
                      }}
                    >
                      <img
                        src={heroImg}
                        alt="SouVN Shop"
                        className="img-fluid"
                        style={{
                          width: "100%",
                          borderRadius: 24,
                          objectFit: "cover",
                          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          left: -10,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i className="bi bi-gift" style={{ color: "#ee4d2d" }}></i>
                        <span>{t.heroBadgeSouvenir || "Lưu niệm"}</span>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          top: "42%",
                          right: -14,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i
                          className="bi bi-cart-check"
                          style={{ color: "#ee4d2d" }}
                        ></i>
                        <span>{t.heroBadgeShopping || "Mua sắm"}</span>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          bottom: 16,
                          left: 20,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i className="bi bi-globe" style={{ color: "#ee4d2d" }}></i>
                        <span>{t.heroBadgeVisitor || "Khách tham quan"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 28 }}>
            <div style={{ ...pageCard, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={sectionSubTitle}>
                  {t.shopByGroup || "Mua sắm theo nhóm"}
                </div>
                <h2 style={sectionTitle}>
                  {t.featuredCategories || "Danh mục nổi bật"}
                </h2>
              </div>

              <div className="row g-3">
                {categories.map((item, index) => (
                  <div key={index} className="col-6 col-md-4 col-lg-2">
                    <Link
                      to={`/products?categoryIds=${item.categoryIds}`}
                      style={{
                        background: "#fff7ed",
                        borderRadius: 16,
                        padding: "18px 14px",
                        textAlign: "center",
                        border: "1px solid #fed7aa",
                        height: "100%",
                        display: "block",
                        textDecoration: "none",
                        transition: "0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 20px rgba(238,77,45,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          margin: "0 auto 12px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ffffff",
                          color: "#ee4d2d",
                          fontSize: 20,
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <i className={item.icon}></i>
                      </div>

                      <div
                        style={{
                          color: "#c2410c",
                          fontWeight: 700,
                          fontSize: 15,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.text}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 28 }}>
            <div style={{ ...pageCard, padding: 24 }}>
              <div
                className="d-flex flex-wrap justify-content-between align-items-center gap-3"
                style={{ marginBottom: 20 }}
              >
                <div>
                  <div style={sectionSubTitle}>
                    {t.suggestedForYou || "Gợi ý cho bạn"}
                  </div>
                  <h2 style={sectionTitle}>
                    {t.featuredProducts || "Sản phẩm nổi bật"}
                  </h2>
                </div>

                <Link
                  to="/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#ee4d2d",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {t.viewAll || "Xem tất cả"}
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {productErr && (
                <div
                  className="alert mb-3"
                  role="alert"
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                  }}
                >
                  {productErr}
                </div>
              )}

              {loadingProducts ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                    {t.loadingProducts || "Đang tải sản phẩm..."}
                  </p>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: 16,
                    padding: 24,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
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

          <section style={{ marginBottom: 28 }}>
            <div style={{ ...pageCard, padding: 24 }}>
              <div
                className="d-flex flex-wrap justify-content-between align-items-center gap-3"
                style={{ marginBottom: 20 }}
              >
                <div>
                  <div style={sectionSubTitle}>
                    {t.recentUpdates || "Cập nhật gần đây"}
                  </div>
                  <h2 style={sectionTitle}>
                    {t.newProducts || "Sản phẩm mới"}
                  </h2>
                </div>

                <Link
                  to="/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#ee4d2d",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {t.viewAll || "Xem tất cả"}
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {loadingProducts ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                    {t.loadingNewProducts || "Đang tải sản phẩm mới..."}
                  </p>
                </div>
              ) : newProducts.length === 0 ? (
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: 16,
                    padding: 24,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
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

          <section>
            <div style={{ ...pageCard, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={sectionSubTitle}>
                  {t.ourCommitment || "Cam kết của chúng tôi"}
                </div>
                <h2 style={sectionTitle}>
                  {t.whyChooseSouVN || "Vì sao chọn SouVN?"}
                </h2>
              </div>

              <div className="row g-3">
                {reasons.map((item, index) => (
                  <div key={index} className="col-md-6 col-lg-3">
                    <div
                      style={{
                        background: "#fff7ed",
                        borderRadius: 16,
                        padding: 20,
                        height: "100%",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ffffff",
                          color: "#ee4d2d",
                          fontSize: 22,
                          marginBottom: 14,
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <i className={item.icon}></i>
                      </div>

                      <div
                        style={{
                          color: "#111827",
                          fontWeight: 700,
                          fontSize: 18,
                          marginBottom: 8,
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          color: "#6b7280",
                          lineHeight: 1.7,
                          fontSize: 14,
                        }}
                      >
                        {item.desc}
                      </div>
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