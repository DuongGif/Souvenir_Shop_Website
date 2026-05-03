import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const footerLink = {
  color: "#4b5563",
  textDecoration: "none",
  display: "block",
  marginBottom: 8,
  fontSize: 14,
};

const socialStyle = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff7ed",
  color: "#ee4d2d",
  border: "1px solid #fed7aa",
  textDecoration: "none",
};

export default function Footer() {
  const year = new Date().getFullYear();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  return (
    <footer
      style={{
        background: "#f5f5f5",
        borderTop: "1px solid #e5e7eb",
        marginTop: 40,
      }}
    >
      <div className="container" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <div className="row gy-4">
            <div className="col-lg-4 col-md-6">
              <h4
                style={{
                  fontWeight: 800,
                  color: "#ee4d2d",
                  marginBottom: 16,
                }}
              >
                SouVN
              </h4>

              <p style={{ color: "#6b7280", lineHeight: 1.8 }}>
                {t.footerAboutText ||
                  "SouVN là cửa hàng quà tặng và đồ lưu niệm dành cho khách tham quan, cung cấp các sản phẩm đẹp, ý nghĩa và phù hợp làm quà."}
              </p>

              <div className="d-flex gap-2 mt-3">
                {["facebook", "instagram", "tiktok", "youtube"].map((s, i) => (
                  <a key={i} href="#" style={socialStyle}>
                    <i className={`bi bi-${s}`}></i>
                  </a>
                ))}
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                {t.footerQuickLinks || "Liên kết"}
              </h5>

              <Link to="/" style={footerLink}>
                {t.navHome || "Trang chủ"}
              </Link>
              <Link to="/products" style={footerLink}>
                {t.navProducts || "Sản phẩm"}
              </Link>
              <Link to="/cart" style={footerLink}>
                {t.navCart || "Giỏ hàng"}
              </Link>
              <Link to="/orders" style={footerLink}>
                {t.navOrders || "Đơn hàng"}
              </Link>
              <Link to="/contact" style={footerLink}>
                {t.contact || "Liên hệ"}
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                {t.footerSupport || "Hỗ trợ"}
              </h5>

              <Link to="/account" style={footerLink}>
                {t.footerMyAccount || "Tài khoản của tôi"}
              </Link>
              <Link to="/orders" style={footerLink}>
                {t.footerTrackOrder || "Tra cứu đơn hàng"}
              </Link>
              <Link to="/contact" style={footerLink}>
                {t.footerReturnPolicy || "Chính sách đổi trả"}
              </Link>
              <Link to="/contact" style={footerLink}>
                {t.footerFaq || "FAQ"}
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                {t.contact || "Liên hệ"}
              </h5>

              <div style={{ color: "#4b5563", lineHeight: 2 }}>
                <div>
                  <i className="bi bi-geo-alt me-2" style={{ color: "#ee4d2d" }}></i>
                  {t.addressValue || "Hà Nội, Việt Nam"}
                </div>

                <div>
                  <i className="bi bi-telephone me-2" style={{ color: "#ee4d2d" }}></i>
                  0346673447
                </div>

                <div>
                  <i className="bi bi-envelope me-2" style={{ color: "#ee4d2d" }}></i>
                  admin@souvenir.com
                </div>

                <div>
                  <i className="bi bi-clock me-2" style={{ color: "#ee4d2d" }}></i>
                  08:00 - 22:00
                </div>
              </div>
            </div>
          </div>

          <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-2"
            style={{ fontSize: 14 }}
          >
            <div style={{ color: "#6b7280" }}>
              © {year} <strong>SouVN</strong>. {t.footerRights || "All rights reserved."}
            </div>

            <div className="d-flex gap-3">
              <span style={{ color: "#9ca3af" }}>
                {t.footerPrivacy || "Bảo mật"}
              </span>
              <span style={{ color: "#9ca3af" }}>
                {t.footerTerms || "Điều khoản"}
              </span>
              <span style={{ color: "#9ca3af" }}>
                {t.footerPolicy || "Chính sách"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}