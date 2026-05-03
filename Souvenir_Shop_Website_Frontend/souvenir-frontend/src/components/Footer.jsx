import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

export default function Footer() {
  const year = new Date().getFullYear();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const socialLinks = [
    { name: "Facebook", icon: "bi-facebook" },
    { name: "Instagram", icon: "bi-instagram" },
    { name: "TikTok", icon: "bi-tiktok" },
    { name: "YouTube", icon: "bi-youtube" },
  ];

  return (
    <footer className="souvn-footer">
      <div className="container souvn-footer-container">
        <div className="souvn-footer-card">
          <div className="row gy-4">
            <div className="col-lg-4 col-md-6">
              <h4 className="souvn-footer-brand">SouVN</h4>

              <p className="souvn-footer-desc">
                {t.footerAboutText ||
                  "SouVN là cửa hàng quà tặng và đồ lưu niệm dành cho khách tham quan, cung cấp các sản phẩm đẹp, ý nghĩa và phù hợp làm quà."}
              </p>

              <div className="souvn-footer-socials">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href="#"
                    className="souvn-footer-social-link"
                    aria-label={item.name}
                  >
                    <i className={`bi ${item.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5 className="souvn-footer-title">
                {t.footerQuickLinks || "Liên kết"}
              </h5>

              <Link to="/" className="souvn-footer-link">
                {t.navHome || "Trang chủ"}
              </Link>

              <Link to="/products" className="souvn-footer-link">
                {t.navProducts || "Sản phẩm"}
              </Link>

              <Link to="/cart" className="souvn-footer-link">
                {t.navCart || "Giỏ hàng"}
              </Link>

              <Link to="/orders" className="souvn-footer-link">
                {t.navOrders || "Đơn hàng"}
              </Link>

              <Link to="/contact" className="souvn-footer-link">
                {t.contact || "Liên hệ"}
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <h5 className="souvn-footer-title">
                {t.footerSupport || "Hỗ trợ"}
              </h5>

              <Link to="/account" className="souvn-footer-link">
                {t.footerMyAccount || "Tài khoản của tôi"}
              </Link>

              <Link to="/orders" className="souvn-footer-link">
                {t.footerTrackOrder || "Tra cứu đơn hàng"}
              </Link>

              <Link to="/contact" className="souvn-footer-link">
                {t.footerReturnPolicy || "Chính sách đổi trả"}
              </Link>

              <Link to="/contact" className="souvn-footer-link">
                {t.footerFaq || "FAQ"}
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <h5 className="souvn-footer-title">
                {t.contact || "Liên hệ"}
              </h5>

              <div className="souvn-footer-contact">
                <div className="souvn-footer-contact-item">
                  <i className="bi bi-geo-alt"></i>
                  <span>{t.addressValue || "Hà Nội, Việt Nam"}</span>
                </div>

                <div className="souvn-footer-contact-item">
                  <i className="bi bi-telephone"></i>
                  <span>0346673447</span>
                </div>

                <div className="souvn-footer-contact-item">
                  <i className="bi bi-envelope"></i>
                  <span>admin@souvenir.com</span>
                </div>

                <div className="souvn-footer-contact-item">
                  <i className="bi bi-clock"></i>
                  <span>08:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="souvn-footer-divider" />

          <div className="souvn-footer-bottom">
            <div className="souvn-footer-copyright">
              © {year} <strong>SouVN</strong>.{" "}
              {t.footerRights || "All rights reserved."}
            </div>

            <div className="souvn-footer-policy-list">
              <span className="souvn-footer-policy-item">
                {t.footerPrivacy || "Bảo mật"}
              </span>

              <span className="souvn-footer-policy-item">
                {t.footerTerms || "Điều khoản"}
              </span>

              <span className="souvn-footer-policy-item">
                {t.footerPolicy || "Chính sách"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}