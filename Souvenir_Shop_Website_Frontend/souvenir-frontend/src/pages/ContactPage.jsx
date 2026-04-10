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
    background:
      "radial-gradient(circle at top center, rgba(56,189,248,0.10), transparent 25%), linear-gradient(180deg, #04131f 0%, #071a29 60%, #0a1f31 100%)",
    paddingTop: 50,
    paddingBottom: 60,
  }}
>
  <div className="container" data-aos="fade-up">
    <div
      className="text-center mb-5"
      style={{
        paddingTop: 20,
      }}
    >
      {/* Badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 999,
          background: "rgba(56,189,248,0.12)",
          color: "#38bdf8",
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 26,
          border: "1px solid rgba(56,189,248,0.18)",
          boxShadow: "0 10px 30px rgba(13,110,253,0.15)",
        }}
      >
        <i className="bi bi-chat-dots-fill"></i>
        Liên hệ với SouVN
      </span>

      {/* Title */}
      <h2
        style={{
          fontWeight: 800,
          marginBottom: 20,
          color: "#f8fafc",
          fontSize: "clamp(34px, 5vw, 60px)",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          textShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        Chúng tôi luôn sẵn sàng hỗ trợ bạn
      </h2>

      {/* Description */}
      <p
        style={{
          maxWidth: 820,
          margin: "0 auto",
          color: "rgba(226,232,240,0.85)",
          lineHeight: 1.9,
          fontSize: 18,
        }}
      >
        Hãy liên hệ với SouVN nếu bạn cần tư vấn sản phẩm lưu niệm, hỗ trợ đơn
        hàng, hợp tác kinh doanh hoặc giải đáp các thắc mắc trong quá trình mua
        sắm.
      </p>
    </div>

          <div className="row g-4">
            <div className="col-lg-5">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(13,110,253,0.18), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 24,
                  padding: 32,
                  color: "#fff",
                  height: "100%",
                }}
              >
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                  Thông tin liên hệ
                </h3>

                <div className="d-grid gap-3">
                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      <i className="bi bi-geo-alt me-2"></i>
                      Địa chỉ
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)" }}>
                      Hà Nội, Việt Nam
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      <i className="bi bi-telephone me-2"></i>
                      Số điện thoại
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)" }}>
                      0123 456 789
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      <i className="bi bi-envelope me-2"></i>
                      Email
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)" }}>
                      souvn@example.com
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      <i className="bi bi-clock me-2"></i>
                      Giờ làm việc
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)" }}>
                      08:00 - 22:00, tất cả các ngày trong tuần
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>
                    Kết nối với chúng tôi
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    <a
                      href="#"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <i className="bi bi-facebook"></i>
                    </a>
                    <a
                      href="#"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <i className="bi bi-instagram"></i>
                    </a>
                    <a
                      href="#"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <i className="bi bi-tiktok"></i>
                    </a>
                    <a
                      href="#"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <i className="bi bi-youtube"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: 32,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 20,
                  }}
                >
                  Gửi thông tin liên hệ
                </h3>

                {err && (
                  <div className="alert alert-danger" role="alert">
                    {err}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="row g-3">
                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
                      <label
                        className="form-label"
                        style={{ color: "#334155", fontWeight: 600 }}
                      >
                        Chủ đề
                      </label>
                      <input
                        name="subject"
                        className="form-control"
                        placeholder="Ví dụ: Hỗ trợ đơn hàng"
                        value={form.subject}
                        onChange={change}
                        style={{ height: 48, borderRadius: 12 }}
                      />
                    </div>

                    <div className="col-12">
                      <label
                        className="form-label"
                        style={{ color: "#334155", fontWeight: 600 }}
                      >
                        Nội dung
                      </label>
                      <textarea
                        name="message"
                        className="form-control"
                        rows={6}
                        placeholder="Nhập nội dung bạn muốn liên hệ"
                        value={form.message}
                        onChange={change}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary mt-4"
                    disabled={loading}
                    style={{
                      minWidth: 180,
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Đang gửi..." : "Gửi liên hệ"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 18,
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
            >
              <iframe
                title="SouVN Map"
                src="https://www.google.com/maps?q=Ha%20Noi%2C%20Viet%20Nam&z=13&output=embed"
                width="100%"
                height="360"
                style={{ border: 0, borderRadius: 18 }}
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