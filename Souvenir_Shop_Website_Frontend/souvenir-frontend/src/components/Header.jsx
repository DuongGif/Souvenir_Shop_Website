import { Link, NavLink } from "react-router-dom";
import logo from "../assets/img/logo.png";

export default function Header() {
  return (
    <header
      id="header"
      className="header d-flex align-items-center light-background sticky-top"
    >
      <div className="container position-relative d-flex align-items-center justify-content-between">
        <Link to="/" className="logo d-flex align-items-center me-auto me-xl-0">
          <img src={logo} alt="SouVN Logo" />
          <h1 className="sitename">SouVN</h1>
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

            <li>
              <NavLink to="/wishlist">Yêu thích</NavLink>
            </li>

            <li>
              <NavLink to="/cart">Giỏ hàng</NavLink>
            </li>

            <li>
              <NavLink to="/orders">Đơn hàng</NavLink>
            </li>

            <li className="dropdown">
              <a href="#">
                <span>Tài khoản</span>{" "}
                <i className="bi bi-chevron-down toggle-dropdown"></i>
              </a>
              <ul>
                <li>
                  <NavLink to="/login">Đăng nhập</NavLink>
                </li>
                <li>
                  <NavLink to="/account">Đăng ký</NavLink>
                </li>
              </ul>
            </li>

            <li>
              <NavLink to="/contact">Liên hệ</NavLink>
            </li>
          </ul>

          <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
        </nav>

        <div className="header-social-links">
          <a href="#" className="facebook" aria-label="Facebook">
            <i className="bi bi-facebook"></i>
          </a>
          <a href="#" className="instagram" aria-label="Instagram">
            <i className="bi bi-instagram"></i>
          </a>
          <a href="#" className="tiktok" aria-label="TikTok">
            <i className="bi bi-tiktok"></i>
          </a>
          <a href="#" className="youtube" aria-label="YouTube">
            <i className="bi bi-youtube"></i>
          </a>
        </div>
      </div>
    </header>
  );
}