import MainLayout from "../layouts/MainLayout";
import heroImg from "../assets/img/profile/profile-square-11.webp";

export default function HomePage() {
  return (
    <MainLayout>
       <main class="main">
      <section id="hero" className="hero section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4 align-items-center">
            <div className="col-lg-6 order-2 order-lg-1">
              <div className="hero-content">
                <h1 data-aos="fade-up" data-aos-delay="200">
                  Chào mừng đến với{" "}
                  <span className="highlight">SouVN Shop</span>
                </h1>

                <h2 data-aos="fade-up" data-aos-delay="300">
                  Đồ án xây dựng{" "}
                  <span className="highlight">
                    website bán đồ lưu niệm cho khách tham quan
                  </span>
                </h2>

                <p data-aos="fade-up" data-aos-delay="400">
                  Đây là dự án xây dựng website thương mại điện tử chuyên cung cấp
                  các sản phẩm lưu niệm dành cho khách du lịch và khách tham quan.
                  Hệ thống hỗ trợ người dùng dễ dàng tìm kiếm sản phẩm, xem chi
                  tiết, thêm vào giỏ hàng, đặt hàng và thanh toán trực tuyến.
                  Ngoài ra, website còn hỗ trợ quản lý sản phẩm, đơn hàng, người
                  dùng và đánh giá, giúp việc vận hành cửa hàng trở nên thuận tiện
                  và hiệu quả hơn.
                </p>

                <div className="hero-actions" data-aos="fade-up" data-aos-delay="500">
                  <a href="/products" className="btn btn-primary">
                    Xem sản phẩm
                  </a>
                  <a href="/contact" className="btn btn-outline">
                    Liên hệ
                  </a>
                </div>

                <div className="social-links" data-aos="fade-up" data-aos-delay="600">
                  <a href="#">
                    <i className="bi bi-bag-heart"></i>
                  </a>
                  <a href="#">
                    <i className="bi bi-cart3"></i>
                  </a>
                  <a href="#">
                    <i className="bi bi-box-seam"></i>
                  </a>
                  <a href="#">
                    <i className="bi bi-stars"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-6 order-1 order-lg-2">
              <div className="hero-image" data-aos="zoom-in" data-aos-delay="300">
                <div className="image-wrapper">
                  <img
                    src={heroImg}
                    alt="Souvenir Shop"
                    className="img-fluid"
                  />

                  <div className="floating-elements">
                    <div
                      className="floating-card design"
                      data-aos="fade-left"
                      data-aos-delay="700"
                    >
                      <i className="bi bi-gift"></i>
                      <span>Lưu niệm</span>
                    </div>

                    <div
                      className="floating-card code"
                      data-aos="fade-right"
                      data-aos-delay="800"
                    >
                      <i className="bi bi-cart-check"></i>
                      <span>Mua sắm</span>
                    </div>

                    <div
                      className="floating-card creativity"
                      data-aos="fade-up"
                      data-aos-delay="900"
                    >
                      <i className="bi bi-globe"></i>
                      <span>Khách tham quan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </MainLayout>
  );
}