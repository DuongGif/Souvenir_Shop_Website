import React from "react";
import { Link } from "react-router-dom";

const quickLinks = [
  {
    title: "Người dùng",
    desc: "Quản lý tài khoản, khóa hoặc mở khóa người dùng.",
    to: "/admin/users",
    icon: "bi-people",
  },
  {
    title: "Sản phẩm",
    desc: "Xem và quản lý danh sách sản phẩm lưu niệm.",
    to: "/admin/products",
    icon: "bi-box-seam",
  },
  {
    title: "Đơn hàng",
    desc: "Theo dõi trạng thái và xử lý đơn hàng của khách.",
    to: "/admin/orders",
    icon: "bi-receipt",
  },
  {
    title: "Mã giảm giá",
    desc: "Tạo và quản lý coupon cho chương trình khuyến mãi.",
    to: "/admin/coupons",
    icon: "bi-ticket-perforated",
  },
  {
    title: "Đánh giá",
    desc: "Kiểm duyệt và phản hồi đánh giá sản phẩm.",
    to: "/admin/reviews",
    icon: "bi-chat-square-text",
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-4">
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
          Tổng quan quản trị
        </div>

        <h2
          style={{
            marginBottom: 8,
            color: "#0f172a",
            fontWeight: 700,
          }}
        >
          Admin Dashboard
        </h2>

        <p style={{ marginBottom: 0, color: "#64748b" }}>
          Quản lý hệ thống người dùng, sản phẩm, đơn hàng, mã giảm giá và đánh giá
          từ một nơi duy nhất.
        </p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 20,
              padding: 22,
              height: "100%",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#dbeafe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 14,
              }}
            >
              <i className="bi bi-people"></i>
            </div>
            <h4 style={{ color: "#0f172a", fontWeight: 700 }}>Người dùng</h4>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Theo dõi và quản lý tài khoản khách hàng trong hệ thống.
            </p>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 20,
              padding: 22,
              height: "100%",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 14,
              }}
            >
              <i className="bi bi-box-seam"></i>
            </div>
            <h4 style={{ color: "#0f172a", fontWeight: 700 }}>Sản phẩm</h4>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Quản lý danh mục sản phẩm lưu niệm và thông tin hiển thị.
            </p>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 20,
              padding: 22,
              height: "100%",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 14,
              }}
            >
              <i className="bi bi-receipt"></i>
            </div>
            <h4 style={{ color: "#0f172a", fontWeight: 700 }}>Đơn hàng</h4>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Theo dõi tình trạng xử lý và thanh toán của các đơn hàng.
            </p>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 20,
              padding: 22,
              height: "100%",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#fce7f3",
                color: "#db2777",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 14,
              }}
            >
              <i className="bi bi-ticket-perforated"></i>
            </div>
            <h4 style={{ color: "#0f172a", fontWeight: 700 }}>Khuyến mãi</h4>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Quản lý coupon, ưu đãi và chiến dịch giảm giá cho khách hàng.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          border: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            color: "#0f172a",
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          Truy cập nhanh
        </h3>

        <div className="row g-3">
          {quickLinks.map((item) => (
            <div key={item.to} className="col-md-6 col-xl-4">
              <Link
                to={item.to}
                style={{
                  textDecoration: "none",
                  display: "block",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 18,
                    padding: 20,
                    height: "100%",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: "#e2e8f0",
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      marginBottom: 14,
                    }}
                  >
                    <i className={`bi ${item.icon}`}></i>
                  </div>

                  <h5
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </h5>

                  <p
                    style={{
                      color: "#64748b",
                      marginBottom: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}