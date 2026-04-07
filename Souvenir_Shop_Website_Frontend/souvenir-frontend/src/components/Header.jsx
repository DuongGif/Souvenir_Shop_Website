import { Link, NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import logo from "../assets/img/logo.png";

const HEADER_HEIGHT = 88;

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
        className="header d-flex align-items-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: `${HEADER_HEIGHT}px`,
          zIndex: 9999,
          background: "rgba(5, 18, 32, 0.98)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="container position-relative d-flex align-items-center justify-content-between"
          style={{ height: "100%" }}
        >
          <Link to="/" className="logo d-flex align-items-center me-auto me-xl-0">
            <img src={logo} alt="SouVN Logo" />
            <h1 className="sitename" style={{ marginBottom: 0 }}>
              SouVN
            </h1>
          </Link>

          <nav id="navmenu" className="navmenu">
            <ul>
              <li>
                <NavLink to="/" end>
                  Trang chủ
                </NavLink>
              </li>

              <li>
                <NavLink to="/products">Sản phẩm</NavLink>
              </li>

              {isLoggedIn && (
                <li>
                  <NavLink to="/wishlist">Yêu thích</NavLink>
                </li>
              )}

              {isLoggedIn && (
                <li>
                  <NavLink to="/cart">Giỏ hàng</NavLink>
                </li>
              )}

              {isLoggedIn && (
                <li>
                  <NavLink to="/orders">Đơn hàng</NavLink>
                </li>
              )}

              <li className="dropdown">
                <a href="#" onClick={preventDefault}>
                  <span>Tài khoản</span>{" "}
                  <i className="bi bi-chevron-down toggle-dropdown"></i>
                </a>
                <ul>
                  {isLoggedIn ? (
                    <>
                      <li>
                        <NavLink to="/account">Thông tin tài khoản</NavLink>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "10px 20px",
                            width: "100%",
                            textAlign: "left",
                            color: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          Đăng xuất
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <NavLink to="/login">Đăng nhập</NavLink>
                      </li>
                      <li>
                        <NavLink to="/register">Đăng ký</NavLink>
                      </li>
                    </>
                  )}
                </ul>
              </li>

              <li>
                <NavLink to="/contact">Liên hệ</NavLink>
              </li>
            </ul>

            <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
          </nav>

          <div className="header-social-links">
            <a href="#" className="facebook" aria-label="Facebook" onClick={preventDefault}>
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#" className="instagram" aria-label="Instagram" onClick={preventDefault}>
              <i className="bi bi-instagram"></i>
            </a>
            <a href="#" className="tiktok" aria-label="TikTok" onClick={preventDefault}>
              <i className="bi bi-tiktok"></i>
            </a>
            <a href="#" className="youtube" aria-label="YouTube" onClick={preventDefault}>
              <i className="bi bi-youtube"></i>
            </a>
          </div>
        </div>
      </header>

      <div style={{ height: `${HEADER_HEIGHT}px` }} />
    </>
  );
}