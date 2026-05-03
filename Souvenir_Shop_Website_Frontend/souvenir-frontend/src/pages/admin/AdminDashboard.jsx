import { Link } from "react-router-dom";

const overviewCards = [
  {
    title: "Người dùng",
    desc: "Quản lý tài khoản khách hàng và trạng thái hoạt động.",
    icon: "bi-people",
    tone: "blue",
  },
  {
    title: "Sản phẩm",
    desc: "Quản lý sản phẩm, hình ảnh, biến thể và hiển thị.",
    icon: "bi-box-seam",
    tone: "green",
  },
  {
    title: "Đơn hàng",
    desc: "Theo dõi đơn mới, đơn đang giao và đơn hoàn tất.",
    icon: "bi-receipt",
    tone: "amber",
  },
  {
    title: "Mã giảm giá",
    desc: "Tạo coupon và quản lý các chương trình khuyến mãi.",
    icon: "bi-ticket-perforated",
    tone: "pink",
  },
  {
    title: "Chat khách hàng",
    desc: "Phản hồi nhanh các cuộc trò chuyện và tư vấn sản phẩm.",
    icon: "bi-chat-dots",
    tone: "indigo",
  },
  {
    title: "Tài chính",
    desc: "Xem báo cáo doanh thu từ đơn đã đặt và đơn đã giao.",
    icon: "bi-cash-coin",
    tone: "cyan",
  },
];

const urgentActions = [
  {
    title: "Đơn hàng mới",
    desc: "Kiểm tra và xử lý các đơn hàng vừa được tạo.",
    to: "/admin/orders",
    icon: "bi-bag-check",
    tone: "orange",
    buttonText: "Xem đơn hàng",
  },
  {
    title: "Tin nhắn mới",
    desc: "Trả lời khách hàng đang cần tư vấn hoặc hỗ trợ.",
    to: "/admin/chats",
    icon: "bi-chat-left-dots",
    tone: "blue",
    buttonText: "Mở chat",
  },
  {
    title: "Đánh giá cần phản hồi",
    desc: "Xem các đánh giá mới để phản hồi kịp thời.",
    to: "/admin/reviews",
    icon: "bi-stars",
    tone: "purple",
    buttonText: "Xem đánh giá",
  },
];

const quickLinks = [
  {
    title: "Người dùng",
    desc: "Khóa, mở khóa và theo dõi tài khoản người dùng.",
    to: "/admin/users",
    icon: "bi-people",
    tone: "blue",
  },
  {
    title: "Sản phẩm",
    desc: "Quản lý danh sách sản phẩm lưu niệm.",
    to: "/admin/products",
    icon: "bi-box-seam",
    tone: "green",
  },
  {
    title: "Đơn hàng",
    desc: "Theo dõi và xử lý đơn hàng của khách.",
    to: "/admin/orders",
    icon: "bi-receipt",
    tone: "amber",
  },
  {
    title: "Mã giảm giá",
    desc: "Tạo và quản lý coupon khuyến mãi.",
    to: "/admin/coupons",
    icon: "bi-ticket-perforated",
    tone: "pink",
  },
  {
    title: "Đánh giá",
    desc: "Xem và phản hồi đánh giá sản phẩm.",
    to: "/admin/reviews",
    icon: "bi-chat-square-text",
    tone: "violet",
  },
  {
    title: "Chat",
    desc: "Hỗ trợ khách hàng qua hệ thống chat.",
    to: "/admin/chats",
    icon: "bi-chat-dots",
    tone: "indigo",
  },
  {
    title: "Tài chính",
    desc: "Xem báo cáo tài chính và doanh thu.",
    to: "/admin/finance",
    icon: "bi-cash-coin",
    tone: "cyan",
  },
];

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-badge">Tổng quan quản trị</div>

        <h2 className="admin-dashboard-title">Admin Dashboard</h2>

        <p className="admin-dashboard-desc">
          Quản lý người dùng, sản phẩm, đơn hàng, khuyến mãi, đánh giá, chat và
          tài chính từ một nơi duy nhất.
        </p>
      </div>

      <div className="row g-4 admin-dashboard-overview">
        {overviewCards.map((item) => (
          <div key={item.title} className="col-md-6 col-xl-4">
            <div className="admin-dashboard-card">
              <div className={`admin-dashboard-icon ${item.tone}`}>
                <i className={`bi ${item.icon}`}></i>
              </div>

              <h4 className="admin-dashboard-card-title">{item.title}</h4>

              <p className="admin-dashboard-card-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-section">
        <h3 className="admin-dashboard-section-title">Cần xử lý nhanh</h3>

        <div className="row g-3">
          {urgentActions.map((item) => (
            <div key={item.title} className="col-md-6 col-xl-4">
              <div className="admin-dashboard-action-card">
                <div className={`admin-dashboard-icon sm ${item.tone}`}>
                  <i className={`bi ${item.icon}`}></i>
                </div>

                <h5 className="admin-dashboard-action-title">{item.title}</h5>

                <p className="admin-dashboard-action-desc">{item.desc}</p>

                <Link
                  to={item.to}
                  className="btn btn-outline-primary admin-dashboard-action-button"
                >
                  {item.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h3 className="admin-dashboard-section-title">Truy cập nhanh</h3>

        <div className="row g-3">
          {quickLinks.map((item) => (
            <div key={item.to} className="col-md-6 col-xl-4">
              <Link to={item.to} className="admin-dashboard-link">
                <div className="admin-dashboard-link-card">
                  <div className={`admin-dashboard-icon sm ${item.tone}`}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>

                  <h5 className="admin-dashboard-action-title">
                    {item.title}
                  </h5>

                  <p className="admin-dashboard-card-desc">{item.desc}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}