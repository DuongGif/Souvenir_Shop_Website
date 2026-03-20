import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const labelStyle = {
  color: "#111827",
  fontWeight: 600,
};

const inputStyle = {
  height: 48,
  borderRadius: 12,
  color: "#111827",
  backgroundColor: "#fff",
};

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(email, password);
      nav("/products");
    } catch (ex) {
      const data = ex?.response?.data;

      if (typeof data === "string") {
        setErr(data);
      } else if (data?.message) {
        setErr(data.message);
      } else if (data?.title) {
        setErr(data.title);
      } else if (data?.errors) {
        const firstError = Object.values(data.errors)?.flat?.()[0];
        setErr(firstError || "Đăng nhập thất bại");
      } else {
        setErr("Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center align-items-center g-4">
            <div className="col-lg-5">
              <div
                style={{
                  padding: "36px",
                  borderRadius: 24,
                  background:
                    "linear-gradient(135deg, rgba(13,110,253,0.18), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  SouVN
                </span>

                <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
                  Chào mừng bạn quay lại
                </h2>

                <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                  Đăng nhập để tiếp tục mua sắm các sản phẩm lưu niệm dành cho
                  khách tham quan, quản lý đơn hàng, giỏ hàng và danh sách yêu
                  thích của bạn một cách thuận tiện.
                </p>

                <div className="mt-4 d-grid gap-3">
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i className="bi bi-bag-heart me-2"></i>
                    Khám phá quà lưu niệm đặc sắc
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i className="bi bi-cart-check me-2"></i>
                    Theo dõi giỏ hàng và đơn hàng dễ dàng
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i className="bi bi-stars me-2"></i>
                    Trải nghiệm mua sắm hiện đại và trực quan
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: "36px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                }}
              >
                <div className="text-center mb-4">
                  <h3
                    style={{
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: 8,
                    }}
                  >
                    Đăng nhập
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: 0 }}>
                    Nhập thông tin tài khoản để tiếp tục
                  </p>
                </div>

                {err && (
                  <div className="alert alert-danger" role="alert">
                    {err}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label" style={labelStyle}>
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={labelStyle}>
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                    style={{
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: 18,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: 14,
                  }}
                >
                  Demo admin: dùng email <strong>admin@souvenir.com</strong> để
                  vào trang quản trị.
                </div>

                <p className="text-center mt-4 mb-0" style={{ color: "#6b7280" }}>
                  Chưa có tài khoản?{" "}
                  <Link to="/register" style={{ fontWeight: 600 }}>
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}