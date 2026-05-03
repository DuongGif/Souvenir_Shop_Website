import { Link, NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import logo from "../assets/img/logo.png";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const HEADER_HEIGHT = 96;

const socialStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff7ed",
  color: "#ee4d2d",
  textDecoration: "none",
  border: "1px solid #fed7aa",
};

const languageOptions = [
  { value: "vi", label: "VI - Tiếng Việt" },
  { value: "en", label: "EN - English" },
  { value: "ja", label: "JA - 日本語" },
  { value: "ko", label: "KO - 한국어" },
  { value: "zh", label: "ZH - 中文" },
];

export default function Header() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const token = localStorage.getItem("token");
  const isLoggedIn = useMemo(() => !!token, [token]);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "#ee4d2d" : "#111827",
    fontWeight: 700,
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 10,
    transition: "all 0.2s ease",
    background: isActive ? "#fff1ee" : "transparent",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const preventDefault = (e) => e.preventDefault();

  const handleChangeLanguage = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <>
      <header
        id="header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 9999,
          background: "#ffffff",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            background: "#ee4d2d",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div
            className="container d-flex justify-content-between align-items-center"
            style={{
              minHeight: 36,
            }}
          >
            <div>
              {t.headerTopText ||
                "SouVN Shop - Website bán đồ lưu niệm cho khách tham quan"}
            </div>

            <div className="d-flex align-items-center gap-2">
              <a
                href="#"
                onClick={preventDefault}
                style={{
                  ...socialStyle,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="#"
                onClick={preventDefault}
                style={{
                  ...socialStyle,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="#"
                onClick={preventDefault}
                style={{
                  ...socialStyle,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <i className="bi bi-tiktok"></i>
              </a>
              <a
                href="#"
                onClick={preventDefault}
                style={{
                  ...socialStyle,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            height: `${HEADER_HEIGHT - 36}px`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="container d-flex align-items-center justify-content-between">
            <Link
              to="/"
              className="d-flex align-items-center"
              style={{
                textDecoration: "none",
                gap: 10,
              }}
            >
              <img
                src={logo}
                alt="SouVN Logo"
                style={{
                  height: 44,
                  width: 44,
                  objectFit: "contain",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#ee4d2d",
                    lineHeight: 1.1,
                  }}
                >
                  SouVN
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {t.headerBrandSub || "Souvenir Shop"}
                </div>
              </div>
            </Link>

            <nav
              className="d-none d-xl-flex align-items-center"
              style={{ gap: 8 }}
            >
              <NavLink to="/" end style={navLinkStyle}>
                {t.navHome || "Trang chủ"}
              </NavLink>

              <NavLink to="/products" style={navLinkStyle}>
                {t.navProducts || "Sản phẩm"}
              </NavLink>

              {isLoggedIn && (
                <NavLink to="/cart" style={navLinkStyle}>
                  {t.navCart || "Giỏ hàng"}
                </NavLink>
              )}

              {isLoggedIn && (
                <NavLink to="/orders" style={navLinkStyle}>
                  {t.navOrders || "Đơn hàng"}
                </NavLink>
              )}

              <NavLink to="/contact" style={navLinkStyle}>
                {t.contact || "Liên hệ"}
              </NavLink>
            </nav>

            <div className="d-flex align-items-center gap-2">
              <select
                value={language}
                onChange={handleChangeLanguage}
                style={{
                  height: 40,
                  minWidth: 150,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {languageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/account"
                    style={{
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "1px solid #ee4d2d",
                      background: "#fff1ee",
                      color: "#ee4d2d",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    {t.navAccount || "Tài khoản"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      color: "#374151",
                      fontWeight: 700,
                    }}
                  >
                    {t.navLogout || "Đăng xuất"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    style={{
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      color: "#374151",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.loginPageTitle || "Đăng nhập"}
                  </Link>

                  <Link
                    to="/register"
                    style={{
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#ee4d2d",
                      color: "#fff",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.registerNow || "Đăng ký"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: `${HEADER_HEIGHT}px` }} />
    </>
  );
}