import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const menuItems = [
  { to: "/admin", label: "Dashboard", icon: "bi-speedometer2", end: true },
  { to: "/admin/users", label: "Người dùng", icon: "bi-people" },
  { to: "/admin/coupons", label: "Mã giảm giá", icon: "bi-ticket-perforated" },
  { to: "/admin/reviews", label: "Đánh giá", icon: "bi-chat-square-text" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "bi-receipt" },
  { to: "/admin/products", label: "Sản phẩm", icon: "bi-box-seam" },
];

export default function AdminPage() {
  return (
    <section className="section">
      <div className="container-fluid" style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div className="row g-4">
          <div className="col-lg-3 col-xl-2">
            <div
              style={{
                background: "#ffffff",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                position: "sticky",
                top: 100,
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#eff6ff",
                    color: "#2563eb",
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Quản trị hệ thống
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: 24,
                  }}
                >
                  Admin Panel
                </h3>
              </div>

              <div className="d-grid gap-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 14,
                      textDecoration: "none",
                      fontWeight: 600,
                      background: isActive ? "#2563eb" : "#f8fafc",
                      color: isActive ? "#ffffff" : "#334155",
                      transition: "all 0.2s ease",
                    })}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <Link
                  to="/"
                  className="btn btn-outline-secondary w-100"
                  style={{
                    borderRadius: 14,
                    height: 44,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  ← Về trang chủ
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-9 col-xl-10">
            <div
              style={{
                background: "#ffffff",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                minHeight: 500,
              }}
            >
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}