import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (data?.errors) {
    const firstError = Object.values(data.errors)?.flat?.()[0];
    if (firstError) return firstError;
  }

  return fallback;
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

  const loginFeatures = useMemo(
    () => [
      t.loginFeature1 || "Mua sắm nhanh chóng",
      t.loginFeature2 || "Quản lý đơn hàng dễ dàng",
      t.loginFeature3 || "Trải nghiệm hiện đại",
    ],
    [t]
  );

  const submit = async (e) => {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      await login(email, password);
      nav("/products");
    } catch (ex) {
      setErr(getErrorMessage(ex, t.loginFailed || "Đăng nhập thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="section login-page-section">
        <div className="container">
          <div className="login-card login-header-card">
            <div className="login-header-top">
              <div>
                <div className="login-kicker">
                  {t.shopName || "SouVN Shop"}
                </div>

                <h2 className="login-title">
                  {t.loginPageTitle || "Đăng nhập"}
                </h2>
              </div>
            </div>
          </div>

          <div className="row justify-content-center g-4">
            <div className="col-lg-5">
              <div className="login-card login-info-card">
                <h3 className="login-block-title">
                  {t.loginWelcomeBack || "Chào mừng quay lại"}
                </h3>

                <p className="login-desc">
                  {t.loginWelcomeDesc ||
                    "Đăng nhập để tiếp tục mua sắm, quản lý giỏ hàng và đơn hàng của bạn một cách dễ dàng."}
                </p>

                <div className="login-feature-list">
                  {loginFeatures.map((text, index) => (
                    <div key={index} className="login-feature-item">
                      <i className="bi bi-check-circle me-2"></i>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="login-card login-form-card">
                <h3 className="login-block-title">
                  {t.loginAccountTitle || "Đăng nhập tài khoản"}
                </h3>

                {err && (
                  <div className="login-alert-error" role="alert">
                    {err}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label login-form-label">
                      {t.emailLabel || "Email"}
                    </label>

                    <input
                      type="email"
                      className="form-control login-input"
                      placeholder={t.emailPlaceholder || "Nhập email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label login-form-label">
                      {t.passwordLabel || "Mật khẩu"}
                    </label>

                    <input
                      type="password"
                      className="form-control login-input"
                      placeholder={t.passwordPlaceholder || "Nhập mật khẩu"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="login-submit-button"
                  >
                    {loading
                      ? t.loggingIn || "Đang đăng nhập..."
                      : t.loginPageTitle || "Đăng nhập"}
                  </button>
                </form>

                <div className="login-demo-box">
                  {t.loginDemoAdmin || "Demo admin:"}{" "}
                  <strong>admin@souvenir.com</strong>
                </div>

                <p className="login-register-text">
                  {t.noAccountYet || "Chưa có tài khoản?"}{" "}
                  <Link to="/register" className="login-register-link">
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