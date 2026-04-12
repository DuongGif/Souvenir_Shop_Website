import { Link, NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import logo from "../assets/img/logo.png";

const HEADER_HEIGHT = 96;

const navLinkStyle = ({ isActive }) => ({
  color: isActive ? "#ee4d2d" : "#111827",
  fontWeight: 700,
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 10,
  transition: "all 0.2s ease",
  background: isActive ? "#fff1ee" : "transparent",
});

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

export default function Header() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = useMemo(() => !!token, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const preventDefault = (e) => e.preventDefault();

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
        {/* TOP BAR */}
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
            <div>SouVN Shop - Website bán đồ lưu niệm cho khách tham quan</div>

            <div className="d-flex align-items-center gap-2">
              <a href="#" onClick={preventDefault} style={{ ...socialStyle, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" onClick={preventDefault} style={{ ...socialStyle, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" onClick={preventDefault} style={{ ...socialStyle, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <i className="bi bi-tiktok"></i>
              </a>
              <a href="#" onClick={preventDefault} style={{ ...socialStyle, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
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
                  Souvenir Shop
                </div>
              </div>
            </Link>

            <nav className="d-none d-xl-flex align-items-center" style={{ gap: 8 }}>
              <NavLink to="/" end style={navLinkStyle}>
                Trang chủ
              </NavLink>

              <NavLink to="/products" style={navLinkStyle}>
                Sản phẩm
              </NavLink>

              {isLoggedIn && (
                <NavLink to="/cart" style={navLinkStyle}>
                  Giỏ hàng
                </NavLink>
              )}

              {isLoggedIn && (
                <NavLink to="/orders" style={navLinkStyle}>
                  Đơn hàng
                </NavLink>
              )}

              <NavLink to="/contact" style={navLinkStyle}>
                Liên hệ
              </NavLink>
            </nav>

            <div className="d-flex align-items-center gap-2">
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
                    Tài khoản
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
                    Đăng xuất
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
                    Đăng nhập
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
                    Đăng ký
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