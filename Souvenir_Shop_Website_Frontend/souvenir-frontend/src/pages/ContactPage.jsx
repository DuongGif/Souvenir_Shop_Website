import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { contactService } from "../services/contactService";

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

const inputStyle = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  boxShadow: "none",
};

const labelStyle = {
  color: "#111827",
  fontWeight: 700,
  marginBottom: 8,
  fontSize: 14,
};

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
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

    if (!form.fullName.trim()) {
      setErr("Vui lòng nhập họ và tên.");
      return;
    }

    if (!form.email.trim()) {
      setErr("Vui lòng nhập email.");
      return;
    }

    if (!form.message.trim()) {
      setErr("Vui lòng nhập nội dung liên hệ.");
      return;
    }

    try {
      setLoading(true);

      await contactService.send({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setSuccess("Gửi liên hệ thành công. SouVN sẽ phản hồi bạn sớm nhất có thể.");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (ex) {
      setErr(getErrorMessage(ex, "Gửi liên hệ thất bại."));
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
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Liên hệ SouVN
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  Chúng tôi luôn sẵn sàng hỗ trợ bạn
                </h2>
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                Hỗ trợ nhanh và tiện lợi
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-5">
              <div
                style={{
                  ...pageCard,
                  padding: 24,
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    color: "#111827",
                    fontWeight: 800,
                    marginBottom: 18,
                    fontSize: 24,
                  }}
                >
                  Thông tin liên hệ
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  Hãy liên hệ với SouVN nếu bạn cần tư vấn sản phẩm lưu niệm, hỗ
                  trợ đơn hàng, hợp tác kinh doanh hoặc giải đáp các thắc mắc
                  trong quá trình mua sắm.
                </p>

                <div className="d-grid gap-3">
                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      <i
                        className="bi bi-geo-alt me-2"
                        style={{ color: "#ee4d2d" }}
                      ></i>
                      Địa chỉ
                    </div>
                    <div style={{ color: "#4b5563" }}>Hà Nội, Việt Nam</div>
                  </div>

                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      <i
                        className="bi bi-telephone me-2"
                        style={{ color: "#ee4d2d" }}
                      ></i>
                      Số điện thoại
                    </div>
                    <div style={{ color: "#4b5563" }}>0123 456 789</div>
                  </div>

                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      <i
                        className="bi bi-envelope me-2"
                        style={{ color: "#ee4d2d" }}
                      ></i>
                      Email
                    </div>
                    <div style={{ color: "#4b5563" }}>souvn@example.com</div>
                  </div>

                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      <i
                        className="bi bi-clock me-2"
                        style={{ color: "#ee4d2d" }}
                      ></i>
                      Giờ làm việc
                    </div>
                    <div style={{ color: "#4b5563" }}>
                      08:00 - 22:00, tất cả các ngày trong tuần
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      color: "#111827",
                      fontWeight: 800,
                      marginBottom: 12,
                    }}
                  >
                    Kết nối với chúng tôi
                  </div>

                  <div className="d-flex gap-3 flex-wrap">
                    {[
                      "bi-facebook",
                      "bi-instagram",
                      "bi-tiktok",
                      "bi-youtube",
                    ].map((icon, index) => (
                      <a
                        key={index}
                        href="#"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fff7ed",
                          color: "#ee4d2d",
                          textDecoration: "none",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <i className={`bi ${icon}`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div
                style={{
                  ...pageCard,
                  padding: 24,
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    color: "#111827",
                    fontWeight: 800,
                    marginBottom: 20,
                    fontSize: 24,
                  }}
                >
                  Gửi thông tin liên hệ
                </h3>

                {err && (
                  <div
                    className="alert mb-3"
                    role="alert"
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

                {success && (
                  <div
                    className="alert mb-3"
                    role="alert"
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

                <form onSubmit={submit}>
                  <div className="row g-3">
                    <div className="col-md-6">
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

                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="Nhập email"
                        value={form.email}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="col-md-6">
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

                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>
                        Chủ đề
                      </label>
                      <input
                        name="subject"
                        className="form-control"
                        placeholder="Ví dụ: Hỗ trợ đơn hàng"
                        value={form.subject}
                        onChange={change}
                        style={inputStyle}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" style={labelStyle}>
                        Nội dung
                      </label>
                      <textarea
                        name="message"
                        className="form-control"
                        rows={6}
                        placeholder="Nhập nội dung bạn muốn liên hệ"
                        value={form.message}
                        onChange={change}
                        style={{
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          color: "#111827",
                          boxShadow: "none",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      minWidth: 180,
                      height: 46,
                      borderRadius: 10,
                      border: "none",
                      background: "#ee4d2d",
                      color: "#fff",
                      fontWeight: 700,
                      marginTop: 18,
                    }}
                  >
                    {loading ? "Đang gửi..." : "Gửi liên hệ"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div
              style={{
                ...pageCard,
                padding: 16,
              }}
            >
              <div
                style={{
                  color: "#111827",
                  fontWeight: 800,
                  fontSize: 22,
                  marginBottom: 14,
                }}
              >
                Bản đồ
              </div>

              <iframe
                title="SouVN Map"
                src="https://www.google.com/maps?q=Ha%20Noi%2C%20Viet%20Nam&z=13&output=embed"
                width="100%"
                height="360"
                style={{ border: 0, borderRadius: 14 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}