import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const labelStyle = {
  color: "#111827",
  fontWeight: 700,
  marginBottom: 8,
  fontSize: 14,
};

const inputStyle = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  boxShadow: "none",
};

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

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

      if (typeof data === "string") setErr(data);
      else if (data?.message) setErr(data.message);
      else if (data?.title) setErr(data.title);
      else if (data?.errors) {
        const firstError = Object.values(data.errors)?.flat?.()[0];
        setErr(firstError || (t.loginFailed || "Đăng nhập thất bại"));
      } else {
        setErr(t.loginFailed || "Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section
        className="section"
        style={{
          background: "#f5f5f5",
          minHeight: "100vh",
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <div className="container">
          <div
            style={{
              ...pageCard,
              padding: 24,
              marginBottom: 20,
              borderLeft: "5px solid #ee4d2d",
            }}
          >
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div style={{ color: "#6b7280", fontSize: 14, fontWeight: 600 }}>
                  {t.shopName || "SouVN Shop"}
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  {t.loginPageTitle || "Đăng nhập"}
                </h2>
              </div>
            </div>
          </div>

          <div className="row justify-content-center g-4">
            <div className="col-lg-5">
              <div style={{ ...pageCard, padding: 24 }}>
                <h3
                  style={{
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 16,
                  }}
                >
                  {t.loginWelcomeBack || "Chào mừng quay lại"}
                </h3>

                <p style={{ color: "#6b7280", lineHeight: 1.8 }}>
                  {t.loginWelcomeDesc ||
                    "Đăng nhập để tiếp tục mua sắm, quản lý giỏ hàng và đơn hàng của bạn một cách dễ dàng."}
                </p>

                <div className="d-grid gap-3 mt-4">
                  {[
                    t.loginFeature1 || "Mua sắm nhanh chóng",
                    t.loginFeature2 || "Quản lý đơn hàng dễ dàng",
                    t.loginFeature3 || "Trải nghiệm hiện đại",
                  ].map((text, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        borderRadius: 12,
                        padding: 12,
                        color: "#9a3412",
                        fontWeight: 600,
                      }}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div style={{ ...pageCard, padding: 24 }}>
                <h3
                  style={{
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 16,
                  }}
                >
                  {t.loginAccountTitle || "Đăng nhập tài khoản"}
                </h3>

                {err && (
                  <div
                    className="alert mb-3"
                    style={{
                      background: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      borderRadius: 12,
                    }}
                  >
                    {err}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label" style={labelStyle}>
                      {t.emailLabel || "Email"}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder={t.emailPlaceholder || "Nhập email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={labelStyle}>
                      {t.passwordLabel || "Mật khẩu"}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder={t.passwordPlaceholder || "Nhập mật khẩu"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      height: 46,
                      borderRadius: 10,
                      border: "none",
                      background: "#ee4d2d",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {loading
                      ? (t.loggingIn || "Đang đăng nhập...")
                      : (t.loginPageTitle || "Đăng nhập")}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: 16,
                    background: "#fafafa",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  {t.loginDemoAdmin || "Demo admin:"}{" "}
                  <strong>admin@souvenir.com</strong>
                </div>

                <p className="text-center mt-4 mb-0" style={{ color: "#6b7280" }}>
                  {t.noAccountYet || "Chưa có tài khoản?"}{" "}
                  <Link to="/register" style={{ color: "#ee4d2d", fontWeight: 700 }}>
                    {t.registerNow || "Đăng ký ngay"}
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