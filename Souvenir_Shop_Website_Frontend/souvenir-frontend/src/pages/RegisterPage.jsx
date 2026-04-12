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
                  SouVN Shop
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Đăng ký tài khoản
                </h2>
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Bước {step}/2
              </div>
            </div>
          </div>

          <div className="row justify-content-center g-4">
            <div className="col-lg-5">
              <div style={{ ...pageCard, padding: 24, height: "100%" }}>
                <h3
                  style={{
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 16,
                  }}
                >
                  Tạo tài khoản SouVN
                </h3>

                <p style={{ color: "#6b7280", lineHeight: 1.8 }}>
                  Đăng ký nhanh bằng email và mã OTP để bắt đầu mua sắm, theo dõi đơn hàng và quản lý tài khoản dễ dàng.
                </p>

                <div className="d-grid gap-3 mt-4">
                  <div
                    style={{
                      background: step === 1 ? "#fff7ed" : "#fafafa",
                      border: step === 1 ? "1px solid #fed7aa" : "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ color: "#111827", fontWeight: 800, marginBottom: 4 }}>
                      Bước 1
                    </div>
                    <div style={{ color: "#6b7280" }}>Nhập email để nhận mã OTP</div>
                  </div>

                  <div
                    style={{
                      background: step === 2 ? "#fff7ed" : "#fafafa",
                      border: step === 2 ? "1px solid #fed7aa" : "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ color: "#111827", fontWeight: 800, marginBottom: 4 }}>
                      Bước 2
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      Xác thực OTP và hoàn tất đăng ký
                    </div>
                  </div>

                  {[
                    "Đăng ký nhanh chóng",
                    "Xác thực email an toàn",
                    "Bắt đầu mua sắm ngay",
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
                    marginBottom: 8,
                  }}
                >
                  {step === 1 ? "Nhận mã OTP" : "Hoàn tất đăng ký"}
                </h3>

                <p style={{ color: "#6b7280", marginBottom: 20 }}>
                  {step === 1
                    ? "Nhập email để nhận mã xác thực."
                    : "Nhập OTP và thông tin tài khoản của bạn."}
                </p>

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
                    {String(err)}
                  </div>
                )}

                {success && (
                  <div
                    className="alert mb-3"
                    style={{
                      background: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #a7f3d0",
                      borderRadius: 12,
                    }}
                  >
                    {success}
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={sendOtp}>
                    <div className="mb-4">
                      <label className="form-label" style={labelStyle}>
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="Nhập email của bạn"
                        value={form.email}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingSendOtp}
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
                      {loadingSendOtp ? "Đang gửi OTP..." : "Gửi mã OTP"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtpAndRegister}>
                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Email đã nhận OTP
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={otpEmail}
                        readOnly
                        style={{
                          ...inputStyle,
                          background: "#f9fafb",
                          color: "#6b7280",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Mã OTP
                      </label>
                      <input
                        name="otp"
                        className="form-control"
                        placeholder="Nhập mã OTP gồm 6 số"
                        value={form.otp}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Họ và tên
                      </label>
                      <input
                        name="fullName"
                        className="form-control"
                        placeholder="Nhập họ và tên"
                        value={form.fullName}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Số điện thoại
                      </label>
                      <input
                        name="phone"
                        className="form-control"
                        placeholder="Nhập số điện thoại"
                        value={form.phone}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Mật khẩu
                      </label>
                      <input
                        name="password"
                        type="password"
                        className="form-control"
                        placeholder="Nhập mật khẩu"
                        value={form.password}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        disabled={loadingVerify}
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
                        {loadingVerify ? "Đang xác thực..." : "Xác thực OTP và đăng ký"}
                      </button>

                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={loadingSendOtp}
                        style={{
                          width: "100%",
                          height: 46,
                          borderRadius: 10,
                          border: "1px solid #ee4d2d",
                          background: "#fff",
                          color: "#ee4d2d",
                          fontWeight: 700,
                        }}
                      >
                        {loadingSendOtp ? "Đang gửi lại..." : "Gửi lại OTP"}
                      </button>

                      <button
                        type="button"
                        onClick={changeEmail}
                        style={{
                          width: "100%",
                          height: 44,
                          borderRadius: 10,
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          color: "#374151",
                          fontWeight: 700,
                        }}
                      >
                        Đổi email khác
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-center mt-4 mb-0" style={{ color: "#6b7280" }}>
                  Đã có tài khoản?{" "}
                  <Link to="/login" style={{ color: "#ee4d2d", fontWeight: 700 }}>
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