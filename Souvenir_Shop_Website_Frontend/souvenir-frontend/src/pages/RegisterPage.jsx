import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { authService } from "../services/authService";

export default function AccountPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });

      setSuccess("Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.");
      setTimeout(() => {
        nav("/login");
      }, 1200);
    } catch (ex) {
      setErr(ex?.response?.data ?? "Đăng ký thất bại");
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
                  Tạo tài khoản mới
                </span>

                <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
                  Mua sắm quà lưu niệm dễ dàng hơn cùng SouVN
                </h2>

                <p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.8 }}>
                  Đăng ký tài khoản để lưu thông tin mua sắm, theo dõi đơn hàng,
                  quản lý sản phẩm yêu thích và trải nghiệm hệ thống bán đồ lưu niệm
                  dành cho khách tham quan một cách thuận tiện hơn.
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
                    Khám phá nhiều sản phẩm lưu niệm đặc sắc
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i className="bi bi-cart-check me-2"></i>
                    Quản lý giỏ hàng và đơn hàng nhanh chóng
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i className="bi bi-stars me-2"></i>
                    Trải nghiệm giao diện hiện đại, thân thiện
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
                    Đăng ký tài khoản
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: 0 }}>
                    Vui lòng nhập đầy đủ thông tin bên dưới
                  </p>
                </div>

                {err && (
                  <div className="alert alert-danger" role="alert">
                    {String(err)}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#334155", fontWeight: 600 }}
                    >
                      Họ và tên
                    </label>
                    <input
                      name="fullName"
                      className="form-control"
                      placeholder="Nhập họ và tên"
                      value={form.fullName}
                      onChange={change}
                      style={{ height: 48, borderRadius: 12 }}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#334155", fontWeight: 600 }}
                    >
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="Nhập email"
                      value={form.email}
                      onChange={change}
                      style={{ height: 48, borderRadius: 12 }}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#334155", fontWeight: 600 }}
                    >
                      Số điện thoại
                    </label>
                    <input
                      name="phone"
                      className="form-control"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={change}
                      style={{ height: 48, borderRadius: 12 }}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#334155", fontWeight: 600 }}
                    >
                      Mật khẩu
                    </label>
                    <input
                      name="password"
                      type="password"
                      className="form-control"
                      placeholder="Nhập mật khẩu"
                      value={form.password}
                      onChange={change}
                      style={{ height: 48, borderRadius: 12 }}
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
                    {loading ? "Đang đăng ký..." : "Đăng ký"}
                  </button>
                </form>

                <p className="text-center mt-4 mb-0" style={{ color: "#6b7280" }}>
                  Đã có tài khoản?{" "}
                  <Link to="/login" style={{ fontWeight: 600 }}>
                    Đăng nhập ngay
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