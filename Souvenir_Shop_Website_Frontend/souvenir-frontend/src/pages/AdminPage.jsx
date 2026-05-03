import { Link, NavLink, Outlet } from "react-router-dom";

const menuItems = [
  { to: "/admin", label: "Dashboard", icon: "bi-speedometer2", end: true },
  { to: "/admin/users", label: "Người dùng", icon: "bi-people" },
  { to: "/admin/coupons", label: "Mã giảm giá", icon: "bi-ticket-perforated" },
  { to: "/admin/reviews", label: "Đánh giá", icon: "bi-chat-square-text" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "bi-receipt" },
  { to: "/admin/products", label: "Sản phẩm", icon: "bi-box-seam" },
  { to: "/admin/chats", label: "Chat", icon: "bi-chat-dots" },
  { to: "/admin/finance", label: "Tài chính", icon: "bi-cash-coin" },
];

export default function AdminPage() {
  return (
    <section className="section admin-page-section">
      <div className="container-fluid admin-container">
        <div className="admin-shell-card">
          <div className="admin-header-row">
            <div>
              <div className="admin-badge">
                <i className="bi bi-shield-check"></i>
                <span>Quản trị hệ thống</span>
              </div>

              <h2 className="admin-title">Admin Panel</h2>

              <p className="admin-desc">
                Điều hướng nhanh đến các khu vực quản trị của hệ thống.
              </p>
            </div>

            <Link to="/" className="admin-back-home">
              <i className="bi bi-arrow-left"></i>
              <span>Về trang chủ</span>
            </Link>
          </div>

          <div className="admin-menu-grid">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-menu-link ${isActive ? "active" : ""}`
                }
              >
                <span className="admin-menu-icon">
                  <i className={`bi ${item.icon}`}></i>
                </span>

                <span className="admin-menu-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="admin-content-card">
          <Outlet />
        </div>
      </div>
    </section>
  );
}