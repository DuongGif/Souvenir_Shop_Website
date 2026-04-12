import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import heroImg from "../assets/img/profile/profile-square-11.webp";

export default function HomePage() {
  return (
    <MainLayout>
      <main className="main">
        <section
          id="hero"
          className="section"
          style={{
            background: "#f5f5f5",
            minHeight: "100vh",
            paddingTop: 32,
            paddingBottom: 48,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="container">
            <div
              style={{
                background: "#ffffff",
                borderRadius: 24,
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <div className="row g-0 align-items-center">
                <div className="col-lg-6">
                  <div
                    style={{
                      padding: "40px 32px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 10,
                        fontWeight: 600,
                      }}
                    >
                      Chào mừng đến với SouVN Shop
                    </div>

                    <h1
                      style={{
                        fontSize: "clamp(30px, 5vw, 52px)",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        color: "#111827",
                        marginBottom: 16,
                      }}
                    >
                      Website bán <span style={{ color: "#ee4d2d" }}>đồ lưu niệm</span>{" "}
                      cho khách tham quan
                    </h1>

                    <h2
                      style={{
                        fontSize: "clamp(18px, 3vw, 26px)",
                        fontWeight: 700,
                        color: "#374151",
                        lineHeight: 1.5,
                        marginBottom: 18,
                      }}
                    >
                      Dự án xây dựng hệ thống thương mại điện tử hiện đại, trực quan và
                      dễ sử dụng
                    </h2>

                    <p
                      style={{
                        color: "#4b5563",
                        fontSize: 16,
                        lineHeight: 1.8,
                        marginBottom: 24,
                      }}
                    >
                      Đây là dự án xây dựng website thương mại điện tử chuyên cung cấp
                      các sản phẩm lưu niệm dành cho khách du lịch và khách tham quan.
                      Hệ thống hỗ trợ người dùng tìm kiếm sản phẩm, xem chi tiết, thêm
                      vào giỏ hàng, đặt hàng và thanh toán thuận tiện. Ngoài ra, website
                      còn hỗ trợ quản lý sản phẩm, đơn hàng, người dùng và đánh giá,
                      giúp việc vận hành cửa hàng hiệu quả hơn.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 28,
                      }}
                    >
                      <Link
                        to="/products"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 20px",
                          borderRadius: 12,
                          background: "#ee4d2d",
                          color: "#ffffff",
                          textDecoration: "none",
                          fontWeight: 700,
                          boxShadow: "0 8px 18px rgba(238,77,45,0.2)",
                        }}
                      >
                        <i className="bi bi-bag-heart"></i>
                        Xem sản phẩm
                      </Link>

                      <Link
                        to="/contact"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 20px",
                          borderRadius: 12,
                          background: "#ffffff",
                          color: "#ee4d2d",
                          textDecoration: "none",
                          fontWeight: 700,
                          border: "1px solid #ee4d2d",
                        }}
                      >
                        <i className="bi bi-telephone"></i>
                        Liên hệ
                      </Link>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {[
                        { icon: "bi bi-gift", text: "Quà lưu niệm" },
                        { icon: "bi bi-cart3", text: "Mua sắm dễ dàng" },
                        { icon: "bi bi-box-seam", text: "Nhiều sản phẩm" },
                        { icon: "bi bi-stars", text: "Trải nghiệm tốt" },
                      ].map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "#fff7ed",
                            color: "#c2410c",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <i className={item.icon}></i>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div
                    style={{
                      position: "relative",
                      background:
                        "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%, #fef2f2 100%)",
                      minHeight: 520,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 430,
                      }}
                    >
                      <img
                        src={heroImg}
                        alt="SouVN Shop"
                        className="img-fluid"
                        style={{
                          width: "100%",
                          borderRadius: 24,
                          objectFit: "cover",
                          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          left: -10,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i className="bi bi-gift" style={{ color: "#ee4d2d" }}></i>
                        <span>Lưu niệm</span>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          top: "42%",
                          right: -14,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i
                          className="bi bi-cart-check"
                          style={{ color: "#ee4d2d" }}
                        ></i>
                        <span>Mua sắm</span>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          bottom: 16,
                          left: 20,
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: "10px 14px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        <i className="bi bi-globe" style={{ color: "#ee4d2d" }}></i>
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