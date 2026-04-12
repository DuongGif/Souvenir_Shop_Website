import { Link } from "react-router-dom";

const footerLink = {
  color: "#4b5563",
  textDecoration: "none",
  display: "block",
  marginBottom: 8,
  fontSize: 14,
};

const socialStyle = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff7ed",
  color: "#ee4d2d",
  border: "1px solid #fed7aa",
  textDecoration: "none",
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "#f5f5f5",
        borderTop: "1px solid #e5e7eb",
        marginTop: 40,
      }}
    >
      <div className="container" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <div className="row gy-4">
            {/* ABOUT */}
            <div className="col-lg-4 col-md-6">
              <h4
                style={{
                  fontWeight: 800,
                  color: "#ee4d2d",
                  marginBottom: 16,
                }}
              >
                SouVN
              </h4>

              <p style={{ color: "#6b7280", lineHeight: 1.8 }}>
                SouVN là cửa hàng quà tặng và đồ lưu niệm dành cho khách tham
                quan, cung cấp các sản phẩm đẹp, ý nghĩa và phù hợp làm quà.
              </p>

              <div className="d-flex gap-2 mt-3">
                {["facebook", "instagram", "tiktok", "youtube"].map((s, i) => (
                  <a key={i} href="#" style={socialStyle}>
                    <i className={`bi bi-${s}`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="col-lg-2 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Liên kết
              </h5>

              <Link to="/" style={footerLink}>
                Trang chủ
              </Link>
              <Link to="/products" style={footerLink}>
                Sản phẩm
              </Link>
              <Link to="/cart" style={footerLink}>
                Giỏ hàng
              </Link>
              <Link to="/orders" style={footerLink}>
                Đơn hàng
              </Link>
              <Link to="/contact" style={footerLink}>
                Liên hệ
              </Link>
            </div>

            {/* SUPPORT */}
            <div className="col-lg-3 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Hỗ trợ
              </h5>

              <Link to="/account" style={footerLink}>
                Tài khoản của tôi
              </Link>
              <Link to="/orders" style={footerLink}>
                Tra cứu đơn hàng
              </Link>
              <Link to="/contact" style={footerLink}>
                Chính sách đổi trả
              </Link>
              <Link to="/contact" style={footerLink}>
                FAQ
              </Link>
            </div>

            {/* CONTACT */}
            <div className="col-lg-3 col-md-6">
              <h5
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Liên hệ
              </h5>

              <div style={{ color: "#4b5563", lineHeight: 2 }}>
                <div>
                  <i className="bi bi-geo-alt me-2" style={{ color: "#ee4d2d" }}></i>
                  Hà Nội, Việt Nam
                </div>

                <div>
                  <i className="bi bi-telephone me-2" style={{ color: "#ee4d2d" }}></i>
                  0346673447
                </div>

                <div>
                  <i className="bi bi-envelope me-2" style={{ color: "#ee4d2d" }}></i>
                  admin@souvenir.com
                </div>

                <div>
                  <i className="bi bi-clock me-2" style={{ color: "#ee4d2d" }}></i>
                  08:00 - 22:00
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-2"
            style={{ fontSize: 14 }}
          >
            <div style={{ color: "#6b7280" }}>
              © {year} <strong>SouVN</strong>. All rights reserved.
            </div>

            <div className="d-flex gap-3">
              <span style={{ color: "#9ca3af" }}>Bảo mật</span>
              <span style={{ color: "#9ca3af" }}>Điều khoản</span>
              <span style={{ color: "#9ca3af" }}>Chính sách</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}