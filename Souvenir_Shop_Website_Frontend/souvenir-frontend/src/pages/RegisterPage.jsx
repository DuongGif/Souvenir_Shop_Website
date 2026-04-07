import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { authService } from "../services/authService";

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

export default function AccountPage() {
  const nav = useNavigate();

  const [step, setStep] = useState(1);
  const [otpEmail, setOtpEmail] = useState("");
  const [form, setForm] = useState({
    email: "",
    otp: "",
    fullName: "",
    phone: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    const email = form.email.trim();

    if (!email) {
      setErr("Vui lòng nhập email.");
      return;
    }

    try {
      setLoadingSendOtp(true);

      await authService.sendRegisterOtp({ email });

      setOtpEmail(email);
      setSuccess("Mã OTP đã được gửi về email của bạn.");
      setStep(2);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể gửi OTP."));
    } finally {
      setLoadingSendOtp(false);
    }
  };

  const verifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!otpEmail.trim()) {
      setErr("Email xác thực không hợp lệ.");
      return;
    }

    if (!form.otp.trim()) {
      setErr("Vui lòng nhập mã OTP.");
      return;
    }

    if (!form.password.trim()) {
      setErr("Vui lòng nhập mật khẩu.");
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

      setSuccess("Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.");

      setTimeout(() => {
        nav("/login");
      }, 1200);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Xác thực OTP thất bại."));
    } finally {
      setLoadingVerify(false);
    }
  };

  const resendOtp = async () => {
    setErr("");
    setSuccess("");

    if (!otpEmail.trim()) {
      setErr("Không tìm thấy email để gửi lại OTP.");
      return;
    }

    try {
      setLoadingSendOtp(true);

      await authService.sendRegisterOtp({
        email: otpEmail,
      });

      setSuccess("Mã OTP mới đã được gửi lại về email của bạn.");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể gửi lại OTP."));
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
                  Đăng ký bằng OTP email
                </span>

                <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
                  Tạo tài khoản SouVN nhanh chóng
                </h2>

                <p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.8 }}>
                  Bạn chỉ cần nhập email để nhận mã OTP, sau đó xác thực và hoàn tất
                  đăng ký tài khoản để mua sắm, theo dõi đơn hàng và lưu sản phẩm yêu thích.
                </p>
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
                    {step === 1
                      ? "Bước 1: Nhập email để nhận OTP"
                      : "Bước 2: Nhập OTP và hoàn tất đăng ký"}
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

                {step === 1 ? (
                  <form onSubmit={sendOtp}>
                    <div className="mb-4">
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
                        placeholder="Nhập email của bạn"
                        value={form.email}
                        onChange={change}
                        style={{ height: 48, borderRadius: 12 }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loadingSendOtp}
                      style={{
                        height: 48,
                        borderRadius: 12,
                        fontWeight: 600,
                      }}
                    >
                      {loadingSendOtp ? "Đang gửi OTP..." : "Gửi mã OTP"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtpAndRegister}>
                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#334155", fontWeight: 600 }}
                      >
                        Email đã nhận OTP
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={otpEmail}
                        readOnly
                        style={{
                          height: 48,
                          borderRadius: 12,
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#334155", fontWeight: 600 }}
                      >
                        Mã OTP
                      </label>
                      <input
                        name="otp"
                        className="form-control"
                        placeholder="Nhập mã OTP gồm 6 số"
                        value={form.otp}
                        onChange={change}
                        style={{ height: 48, borderRadius: 12 }}
                      />
                    </div>

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

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loadingVerify}
                        style={{
                          height: 48,
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {loadingVerify ? "Đang xác thực..." : "Xác thực OTP và đăng ký"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        onClick={resendOtp}
                        disabled={loadingSendOtp}
                        style={{
                          height: 48,
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {loadingSendOtp ? "Đang gửi lại..." : "Gửi lại OTP"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={changeEmail}
                        style={{ textDecoration: "none" }}
                      >
                        Đổi email khác
                      </button>
                    </div>
                  </form>
                )}

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