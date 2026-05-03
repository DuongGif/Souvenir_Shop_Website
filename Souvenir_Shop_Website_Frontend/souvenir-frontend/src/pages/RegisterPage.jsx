import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { authService } from "../services/authService";
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

const initialForm = {
  email: "",
  otp: "",
  fullName: "",
  phone: "",
  password: "",
};

export default function RegisterPage() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [step, setStep] = useState(1);
  const [otpEmail, setOtpEmail] = useState("");
  const [form, setForm] = useState(initialForm);

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const registerFeatures = useMemo(
    () => [
      t.registerFeature1 || "Đăng ký nhanh chóng",
      t.registerFeature2 || "Xác thực email an toàn",
      t.registerFeature3 || "Bắt đầu mua sắm ngay",
    ],
    [t]
  );

  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    const email = form.email.trim();

    if (!email) {
      setErr(t.registerRequireEmail || "Vui lòng nhập email.");
      return;
    }

    try {
      setLoadingSendOtp(true);

      await authService.sendRegisterOtp({ email });

      setOtpEmail(email);
      setSuccess(t.registerOtpSent || "Mã OTP đã được gửi về email của bạn.");
      setStep(2);
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.registerOtpSendFailed || "Không thể gửi OTP.")
      );
    } finally {
      setLoadingSendOtp(false);
    }
  };

  const verifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!otpEmail.trim()) {
      setErr(t.registerInvalidVerifyEmail || "Email xác thực không hợp lệ.");
      return;
    }

    if (!form.otp.trim()) {
      setErr(t.registerRequireOtp || "Vui lòng nhập mã OTP.");
      return;
    }

    if (!form.password.trim()) {
      setErr(t.registerRequirePassword || "Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setLoadingVerify(true);

      await authService.verifyRegisterOtp({
        email: otpEmail,
        otp: form.otp,
        fullName: form.fullName,
        phone: form.phone,
        password: form.password,
      });

      setSuccess(
        t.registerSuccess ||
          "Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ."
      );

      setTimeout(() => {
        nav("/login");
      }, 1200);
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.registerVerifyFailed || "Xác thực OTP thất bại."
        )
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  const resendOtp = async () => {
    setErr("");
    setSuccess("");

    if (!otpEmail.trim()) {
      setErr(
        t.registerResendMissingEmail || "Không tìm thấy email để gửi lại OTP."
      );
      return;
    }

    try {
      setLoadingSendOtp(true);

      await authService.sendRegisterOtp({
        email: otpEmail,
      });

      setSuccess(
        t.registerOtpResent || "Mã OTP mới đã được gửi lại về email của bạn."
      );
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.registerResendFailed || "Không thể gửi lại OTP.")
      );
    } finally {
      setLoadingSendOtp(false);
    }
  };

  const changeEmail = () => {
    setStep(1);
    setErr("");
    setSuccess("");
    setOtpEmail("");

    setForm((prev) => ({
      ...prev,
      otp: "",
      password: "",
    }));
  };

  return (
    <MainLayout>
      <section className="section register-page-section">
        <div className="container">
          <div className="register-card register-header-card">
            <div className="register-header-top">
              <div>
                <div className="register-kicker">
                  {t.shopName || "SouVN Shop"}
                </div>

                <h2 className="register-title">
                  {t.registerPageTitle || "Đăng ký tài khoản"}
                </h2>
              </div>

              <div className="register-step-count">
                {t.registerStepLabel || "Bước"} {step}/2
              </div>
            </div>
          </div>

          <div className="row justify-content-center g-4">
            <div className="col-lg-5">
              <div className="register-card register-info-card">
                <h3 className="register-block-title">
                  {t.registerCreateSouvn || "Tạo tài khoản SouVN"}
                </h3>

                <p className="register-desc">
                  {t.registerIntroDesc ||
                    "Đăng ký nhanh bằng email và mã OTP để bắt đầu mua sắm, theo dõi đơn hàng và quản lý tài khoản dễ dàng."}
                </p>

                <div className="register-info-list">
                  <div
                    className={`register-step-box ${
                      step === 1 ? "active" : ""
                    }`}
                  >
                    <div className="register-step-title">
                      {t.registerStepLabel || "Bước"} 1
                    </div>

                    <div className="register-step-desc">
                      {t.registerStep1Desc || "Nhập email để nhận mã OTP"}
                    </div>
                  </div>

                  <div
                    className={`register-step-box ${
                      step === 2 ? "active" : ""
                    }`}
                  >
                    <div className="register-step-title">
                      {t.registerStepLabel || "Bước"} 2
                    </div>

                    <div className="register-step-desc">
                      {t.registerStep2Desc ||
                        "Xác thực OTP và hoàn tất đăng ký"}
                    </div>
                  </div>

                  {registerFeatures.map((text, index) => (
                    <div key={index} className="register-feature-item">
                      <i className="bi bi-check-circle me-2"></i>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="register-card register-form-card">
                <h3 className="register-form-title">
                  {step === 1
                    ? t.registerGetOtpTitle || "Nhận mã OTP"
                    : t.registerCompleteTitle || "Hoàn tất đăng ký"}
                </h3>

                <p className="register-form-desc">
                  {step === 1
                    ? t.registerGetOtpDesc || "Nhập email để nhận mã xác thực."
                    : t.registerCompleteDesc ||
                      "Nhập OTP và thông tin tài khoản của bạn."}
                </p>

                {err && (
                  <div className="register-alert register-alert-error">
                    {String(err)}
                  </div>
                )}

                {success && (
                  <div className="register-alert register-alert-success">
                    {success}
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={sendOtp}>
                    <div className="mb-4">
                      <label className="form-label register-form-label">
                        {t.emailLabel || "Email"}
                      </label>

                      <input
                        name="email"
                        type="email"
                        className="form-control register-input"
                        placeholder={
                          t.registerEmailPlaceholder || "Nhập email của bạn"
                        }
                        value={form.email}
                        onChange={change}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingSendOtp}
                      className="register-button register-button-primary"
                    >
                      {loadingSendOtp
                        ? t.registerSendingOtp || "Đang gửi OTP..."
                        : t.registerSendOtp || "Gửi mã OTP"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtpAndRegister}>
                    <div className="mb-3">
                      <label className="form-label register-form-label">
                        {t.registerOtpEmailLabel || "Email đã nhận OTP"}
                      </label>

                      <input
                        type="email"
                        className="form-control register-input register-input-readonly"
                        value={otpEmail}
                        readOnly
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label register-form-label">
                        {t.registerOtpLabel || "Mã OTP"}
                      </label>

                      <input
                        name="otp"
                        className="form-control register-input"
                        placeholder={
                          t.registerOtpPlaceholder || "Nhập mã OTP gồm 6 số"
                        }
                        value={form.otp}
                        onChange={change}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label register-form-label">
                        {t.fullNameLabel || "Họ và tên"}
                      </label>

                      <input
                        name="fullName"
                        className="form-control register-input"
                        placeholder={t.fullNamePlaceholder || "Nhập họ và tên"}
                        value={form.fullName}
                        onChange={change}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label register-form-label">
                        {t.phoneLabel || "Số điện thoại"}
                      </label>

                      <input
                        name="phone"
                        className="form-control register-input"
                        placeholder={t.phonePlaceholder || "Nhập số điện thoại"}
                        value={form.phone}
                        onChange={change}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label register-form-label">
                        {t.passwordLabel || "Mật khẩu"}
                      </label>

                      <input
                        name="password"
                        type="password"
                        className="form-control register-input"
                        placeholder={t.passwordPlaceholder || "Nhập mật khẩu"}
                        value={form.password}
                        onChange={change}
                      />
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        disabled={loadingVerify}
                        className="register-button register-button-primary"
                      >
                        {loadingVerify
                          ? t.registerVerifying || "Đang xác thực..."
                          : t.registerVerifyAndCreate ||
                            "Xác thực OTP và đăng ký"}
                      </button>

                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={loadingSendOtp}
                        className="register-button register-button-outline-primary"
                      >
                        {loadingSendOtp
                          ? t.registerResendingOtp || "Đang gửi lại..."
                          : t.registerResendOtp || "Gửi lại OTP"}
                      </button>

                      <button
                        type="button"
                        onClick={changeEmail}
                        className="register-button register-button-secondary"
                      >
                        {t.registerChangeEmail || "Đổi email khác"}
                      </button>
                    </div>
                  </form>
                )}

                <p className="register-login-text">
                  {t.registerHasAccount || "Đã có tài khoản?"}{" "}
                  <Link to="/login" className="register-login-link">
                    {t.loginPageTitle || "Đăng nhập"}
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