import { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const languageOptions = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "ja", label: "JA" },
  { value: "ko", label: "KO" },
  { value: "zh", label: "ZH" },
];

const socialLinks = [
  { name: "Facebook", icon: "bi-facebook" },
  { name: "Instagram", icon: "bi-instagram" },
  { name: "TikTok", icon: "bi-tiktok" },
  { name: "YouTube", icon: "bi-youtube" },
];

export default function Header() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const t =
    commonTranslations?.[language] ||
    commonTranslations?.vi ||
    {};

  const token = localStorage.getItem("token");

  const isLoggedIn = useMemo(
    () => !!token,
    [token]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const navLinkClass = ({ isActive }) =>
    `souvn-nav-link ${isActive ? "active" : ""}`;

  return (
    <>
      <header className="souvn-header">
        {/* TOPBAR */}
        <div className="souvn-header-top">
          <div className="container souvn-header-top-inner">
            <div className="souvn-header-top-text">
              {t.headerTopText ||
                "SouVN Shop - Website bán đồ lưu niệm"}
            </div>

            <div className="souvn-header-socials">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href="/"
                  onClick={(e) => e.preventDefault()}
                  className="souvn-header-social-link"
                >
                  <i className={`bi ${item.icon}`} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="souvn-header-main">
          <div className="container souvn-header-main-inner">
            {/* LOGO */}
            <Link
              to="/"
              className="souvn-header-logo"
            >
              <img
                src={logo}
                alt="SouVN"
                className="souvn-header-logo-img"
              />

              <div className="souvn-header-brand">
                <div className="souvn-header-brand-name">
                  SouVN
                </div>

                <div className="souvn-header-brand-sub">
                  Souvenir Shop
                </div>
              </div>
            </Link>

            {/* NAV */}
            <nav className="souvn-nav">
              <NavLink
                to="/"
                end
                className={navLinkClass}
              >
                {t.navHome || "Trang chủ"}
              </NavLink>

              <NavLink
                to="/products"
                className={navLinkClass}
              >
                {t.navProducts || "Sản phẩm"}
              </NavLink>

              {isLoggedIn && (
                <NavLink
                  to="/cart"
                  className={navLinkClass}
                >
                  {t.navCart || "Giỏ hàng"}
                </NavLink>
              )}

              {isLoggedIn && (
                <NavLink
                  to="/orders"
                  className={navLinkClass}
                >
                  {t.navOrders || "Đơn hàng"}
                </NavLink>
              )}

              <NavLink
                to="/contact"
                className={navLinkClass}
              >
                {t.contact || "Liên hệ"}
              </NavLink>
            </nav>

            {/* ACTIONS */}
            <div className="souvn-header-actions">
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                className="souvn-language-select"
              >
                {languageOptions.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/account"
                    className="souvn-header-btn souvn-header-btn-account"
                  >
                    <i className="bi bi-person-circle"></i>

                    <span>
                      {t.navAccount || "Tài khoản"}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="souvn-header-btn souvn-header-btn-logout"
                  >
                    {t.navLogout || "Đăng xuất"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="souvn-header-btn souvn-header-btn-outline"
                  >
                    {t.loginPageTitle || "Đăng nhập"}
                  </Link>

                  <Link
                    to="/register"
                    className="souvn-header-btn souvn-header-btn-primary"
                  >
                    {t.registerNow || "Đăng ký"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="souvn-header-spacer" />
    </>
  );
}