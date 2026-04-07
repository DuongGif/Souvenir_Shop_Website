import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="footer" className="footer" style={{ paddingTop: 40, paddingBottom: 20 }}>
      <div className="container">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6">
            <h4 style={{ marginBottom: 16 }}>SouVN</h4>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              SouVN là cửa hàng quà tặng và đồ lưu niệm dành cho khách tham quan,
              cung cấp các sản phẩm đặc trưng, đẹp mắt và phù hợp để làm quà.
            </p>

            <div className="social-links d-flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                <i className="bi bi-tiktok"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <h5 style={{ marginBottom: 16 }}>Liên kết nhanh</h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
              <li>
                <Link to="/">Trang chủ</Link>
              </li>
              <li>
                <Link to="/products">Sản phẩm</Link>
              </li>
              <li>
                <Link to="/cart">Giỏ hàng</Link>
              </li>
              <li>
                <Link to="/orders">Đơn hàng</Link>
              </li>
              <li>
                <Link to="/contact">Liên hệ</Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 style={{ marginBottom: 16 }}>Hỗ trợ khách hàng</h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
              <li>
                <Link to="/account">Tài khoản của tôi</Link>
              </li>
              <li>
                <Link to="/wishlist">Sản phẩm yêu thích</Link>
              </li>
              <li>
                <Link to="/orders">Tra cứu đơn hàng</Link>
              </li>
              <li>
                <Link to="/contact">Chính sách đổi trả</Link>
              </li>
              <li>
                <Link to="/contact">Câu hỏi thường gặp</Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 style={{ marginBottom: 16 }}>Thông tin liên hệ</h5>
            <div style={{ lineHeight: 2 }}>
              <div>
                <i className="bi bi-geo-alt" style={{ marginRight: 8 }}></i>
                  Hà Nội, Việt Nam
              </div>
              <div>
                <i className="bi bi-telephone" style={{ marginRight: 8 }}></i>
                0346673447
              </div>
              <div>
                <i className="bi bi-envelope" style={{ marginRight: 8 }}></i>
                admin@souvenir.com
              </div>
              <div>
                <i className="bi bi-clock" style={{ marginRight: 8 }}></i>
                08:00 - 22:00 mỗi ngày
              </div>
            </div>
          </div>
        </div>

        <hr style={{ margin: "28px 0 20px" }} />

        <div className="copyright text-center">
          <p style={{ marginBottom: 0 }}>
            © {year} <strong>SouVN</strong>. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}