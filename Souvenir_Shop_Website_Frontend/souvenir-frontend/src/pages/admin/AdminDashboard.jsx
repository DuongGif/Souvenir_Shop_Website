import React from "react";
import { Link } from "react-router-dom";

const overviewCards = [
  {
    title: "Người dùng",
    desc: "Quản lý tài khoản khách hàng và trạng thái hoạt động.",
    icon: "bi-people",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
  },
  {
    title: "Sản phẩm",
    desc: "Quản lý sản phẩm, hình ảnh, biến thể và hiển thị.",
    icon: "bi-box-seam",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    title: "Đơn hàng",
    desc: "Theo dõi đơn mới, đơn đang giao và đơn hoàn tất.",
    icon: "bi-receipt",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    title: "Mã giảm giá",
    desc: "Tạo coupon và quản lý các chương trình khuyến mãi.",
    icon: "bi-ticket-perforated",
    iconBg: "#fce7f3",
    iconColor: "#db2777",
  },
  {
    title: "Chat khách hàng",
    desc: "Phản hồi nhanh các cuộc trò chuyện và tư vấn sản phẩm.",
    icon: "bi-chat-dots",
    iconBg: "#e0e7ff",
    iconColor: "#4f46e5",
  },
  {
    title: "Tài chính",
    desc: "Xem báo cáo doanh thu từ đơn đã đặt và đơn đã giao.",
    icon: "bi-cash-coin",
    iconBg: "#cffafe",
    iconColor: "#0891b2",
  },
];

const urgentActions = [
  {
    title: "Đơn hàng mới",
    desc: "Kiểm tra và xử lý các đơn hàng vừa được tạo.",
    to: "/admin/orders",
    icon: "bi-bag-check",
    iconBg: "#fff7ed",
    iconColor: "#ea580c",
    buttonText: "Xem đơn hàng",
  },
  {
    title: "Tin nhắn mới",
    desc: "Trả lời khách hàng đang cần tư vấn hoặc hỗ trợ.",
    to: "/admin/chats",
    icon: "bi-chat-left-dots",
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    buttonText: "Mở chat",
  },
  {
    title: "Đánh giá cần phản hồi",
    desc: "Xem các đánh giá mới để phản hồi kịp thời.",
    to: "/admin/reviews",
    icon: "bi-stars",
    iconBg: "#f5f3ff",
    iconColor: "#7c3aed",
    buttonText: "Xem đánh giá",
  },
];

const quickLinks = [
  {
    title: "Người dùng",
    desc: "Khóa, mở khóa và theo dõi tài khoản người dùng.",
    to: "/admin/users",
    icon: "bi-people",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
  },
  {
    title: "Sản phẩm",
    desc: "Quản lý danh sách sản phẩm lưu niệm.",
    to: "/admin/products",
    icon: "bi-box-seam",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    title: "Đơn hàng",
    desc: "Theo dõi và xử lý đơn hàng của khách.",
    to: "/admin/orders",
    icon: "bi-receipt",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    title: "Mã giảm giá",
    desc: "Tạo và quản lý coupon khuyến mãi.",
    to: "/admin/coupons",
    icon: "bi-ticket-perforated",
    iconBg: "#fce7f3",
    iconColor: "#db2777",
  },
  {
    title: "Đánh giá",
    desc: "Xem và phản hồi đánh giá sản phẩm.",
    to: "/admin/reviews",
    icon: "bi-chat-square-text",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
  },
  {
    title: "Chat",
    desc: "Hỗ trợ khách hàng qua hệ thống chat.",
    to: "/admin/chats",
    icon: "bi-chat-dots",
    iconBg: "#e0e7ff",
    iconColor: "#4f46e5",
  },
  {
    title: "Tài chính",
    desc: "Xem báo cáo tài chính và doanh thu.",
    to: "/admin/finance",
    icon: "bi-cash-coin",
    iconBg: "#cffafe",
    iconColor: "#0891b2",
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
            fontWeight: 800,
          }}
        >
          Admin Dashboard
        </h2>

        <p style={{ marginBottom: 0, color: "#64748b", lineHeight: 1.7 }}>
          Quản lý người dùng, sản phẩm, đơn hàng, khuyến mãi, đánh giá, chat và
          tài chính từ một nơi duy nhất.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {overviewCards.map((item) => (
          <div key={item.title} className="col-md-6 col-xl-4">
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
                  background: item.iconBg,
                  color: item.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  marginBottom: 14,
                }}
              >
                <i className={`bi ${item.icon}`}></i>
              </div>

              <h4 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 8 }}>
                {item.title}
              </h4>

              <p style={{ color: "#64748b", marginBottom: 0, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          border: "1px solid #e5e7eb",
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            color: "#0f172a",
            fontWeight: 800,
            marginBottom: 18,
          }}
        >
          Cần xử lý nhanh
        </h3>

        <div className="row g-3">
          {urgentActions.map((item) => (
            <div key={item.title} className="col-md-6 col-xl-4">
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 18,
                  padding: 20,
                  height: "100%",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: item.iconBg,
                    color: item.iconColor,
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
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  {item.desc}
                </p>

                <Link
                  to={item.to}
                  className="btn btn-outline-primary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 700,
                  }}
                >
                  {item.buttonText}
                </Link>
              </div>
            </div>
          ))}
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
            fontWeight: 800,
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
                      background: item.iconBg,
                      color: item.iconColor,
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