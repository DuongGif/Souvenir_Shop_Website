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
    <section
      className="section"
      style={{
        paddingTop: 8,
        paddingBottom: 24,
      }}
    >
      <div
        className="container-fluid"
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          maxWidth: 1680,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
            border: "1px solid #eef2f7",
            marginBottom: 24,
          }}
        >
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                <i className="bi bi-shield-check"></i>
                <span>Quản trị hệ thống</span>
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: 34,
                  lineHeight: 1.2,
                }}
              >
                Admin Panel
              </h2>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#64748b",
                  fontSize: 16,
                }}
              >
                Điều hướng nhanh đến các khu vực quản trị của hệ thống.
              </p>
            </div>

            <Link
              to="/"
              className="btn"
              style={{
                borderRadius: 16,
                height: 46,
                padding: "0 18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontWeight: 700,
                background: "#f8fafc",
                color: "#334155",
                border: "1px solid #e2e8f0",
              }}
            >
              <i className="bi bi-arrow-left"></i>
              <span>Về trang chủ</span>
            </Link>
          </div>

          <div
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 4,
            }}
          >
            <div
              className="d-flex align-items-center gap-2 flex-nowrap"
              style={{
                minWidth: "max-content",
              }}
            >
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 18px",
                    borderRadius: 16,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 16,
                    whiteSpace: "nowrap",
                    background: isActive
                      ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                      : "#f8fafc",
                    color: isActive ? "#ffffff" : "#334155",
                    border: isActive
                      ? "1px solid transparent"
                      : "1px solid #e2e8f0",
                    boxShadow: isActive
                      ? "0 12px 24px rgba(37, 99, 235, 0.2)"
                      : "none",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isActive
                            ? "rgba(255,255,255,0.18)"
                            : "#ffffff",
                          color: isActive ? "#ffffff" : "#475569",
                          border: isActive
                            ? "1px solid rgba(255,255,255,0.18)"
                            : "1px solid #e2e8f0",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={`bi ${item.icon}`}
                          style={{ fontSize: 17 }}
                        ></i>
                      </span>

                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 28,
            padding: 30,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
            border: "1px solid #eef2f7",
            minHeight: 600,
          }}
        >
          <Outlet />
        </div>
      </div>
    </section>
  );
}