import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { contactService } from "../services/contactService";
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
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [form, setForm] = useState(initialForm);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!form.fullName.trim()) {
      setErr(t.contactRequireFullName || "Vui lòng nhập họ và tên.");
      return;
    }

    if (!form.email.trim()) {
      setErr(t.contactRequireEmail || "Vui lòng nhập email.");
      return;
    }

    if (!form.message.trim()) {
      setErr(t.contactRequireMessage || "Vui lòng nhập nội dung liên hệ.");
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

      setSuccess(
        t.contactSendSuccess ||
          "Gửi liên hệ thành công. SouVN sẽ phản hồi bạn sớm nhất có thể."
      );

      setForm(initialForm);
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.contactSendFailed || "Gửi liên hệ thất bại.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="section contact-page-section">
        <div className="container">
          <div className="contact-card contact-header-card">
            <div className="contact-header-top">
              <div>
                <div className="contact-kicker">
                  {t.contactHeaderSmall || "Liên hệ SouVN"}
                </div>

                <h2 className="contact-title">
                  {t.contactHeaderTitle || "Chúng tôi luôn sẵn sàng hỗ trợ bạn"}
                </h2>
              </div>

              <div className="contact-header-badge">
                {t.contactHeaderBadge || "Hỗ trợ nhanh và tiện lợi"}
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-5">
              <div className="contact-card contact-info-card">
                <h3 className="contact-block-title">
                  {t.contactInfoTitle || "Thông tin liên hệ"}
                </h3>

                <p className="contact-desc">
                  {t.contactInfoDesc ||
                    "Hãy liên hệ với SouVN nếu bạn cần tư vấn sản phẩm lưu niệm, hỗ trợ đơn hàng, hợp tác kinh doanh hoặc giải đáp các thắc mắc trong quá trình mua sắm."}
                </p>

                <div className="contact-info-list">
                  <div className="contact-info-item">
                    <div className="contact-info-label">
                      <i className="bi bi-geo-alt me-2"></i>
                      {t.addressLabel || "Địa chỉ"}
                    </div>

                    <div className="contact-info-value">
                      {t.addressValue || "Hà Nội, Việt Nam"}
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-label">
                      <i className="bi bi-telephone me-2"></i>
                      {t.phoneLabel || "Số điện thoại"}
                    </div>

                    <div className="contact-info-value">0123 456 789</div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-label">
                      <i className="bi bi-envelope me-2"></i>
                      {t.emailLabel || "Email"}
                    </div>

                    <div className="contact-info-value">souvn@example.com</div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-label">
                      <i className="bi bi-clock me-2"></i>
                      {t.workingHoursLabel || "Giờ làm việc"}
                    </div>

                    <div className="contact-info-value">
                      {t.workingHoursValue ||
                        "08:00 - 22:00, tất cả các ngày trong tuần"}
                    </div>
                  </div>
                </div>

                <div className="contact-social-wrap">
                  <div className="contact-social-title">
                    {t.connectWithUs || "Kết nối với chúng tôi"}
                  </div>

                  <div className="contact-social-list">
                    {[
                      { icon: "bi-facebook", label: "Facebook" },
                      { icon: "bi-instagram", label: "Instagram" },
                      { icon: "bi-tiktok", label: "TikTok" },
                      { icon: "bi-youtube", label: "YouTube" },
                    ].map((item) => (
                      <a
                        key={item.icon}
                        href="#"
                        className="contact-social-link"
                        aria-label={item.label}
                      >
                        <i className={`bi ${item.icon}`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="contact-card contact-form-card">
                <h3 className="contact-form-title">
                  {t.contactFormTitle || "Gửi thông tin liên hệ"}
                </h3>

                {err && (
                  <div className="contact-alert-error" role="alert">
                    {err}
                  </div>
                )}

                {success && (
                  <div className="contact-alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label contact-form-label">
                        {t.fullNameLabel || "Họ và tên"}
                      </label>

                      <input
                        name="fullName"
                        className="form-control contact-input"
                        placeholder={t.fullNamePlaceholder || "Nhập họ và tên"}
                        value={form.fullName}
                        onChange={change}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label contact-form-label">
                        {t.emailLabel || "Email"}
                      </label>

                      <input
                        name="email"
                        type="email"
                        className="form-control contact-input"
                        placeholder={t.emailPlaceholder || "Nhập email"}
                        value={form.email}
                        onChange={change}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label contact-form-label">
                        {t.phoneLabel || "Số điện thoại"}
                      </label>

                      <input
                        name="phone"
                        className="form-control contact-input"
                        placeholder={t.phonePlaceholder || "Nhập số điện thoại"}
                        value={form.phone}
                        onChange={change}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label contact-form-label">
                        {t.subjectLabel || "Chủ đề"}
                      </label>

                      <input
                        name="subject"
                        className="form-control contact-input"
                        placeholder={
                          t.subjectPlaceholder || "Ví dụ: Hỗ trợ đơn hàng"
                        }
                        value={form.subject}
                        onChange={change}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label contact-form-label">
                        {t.content || "Nội dung"}
                      </label>

                      <textarea
                        name="message"
                        className="form-control contact-textarea"
                        rows={6}
                        placeholder={
                          t.contactMessagePlaceholder ||
                          "Nhập nội dung bạn muốn liên hệ"
                        }
                        value={form.message}
                        onChange={change}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="contact-submit-button"
                  >
                    {loading
                      ? t.contactSending || "Đang gửi..."
                      : t.contactSubmit || "Gửi liên hệ"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="contact-map-wrap">
            <div className="contact-card contact-map-card">
              <div className="contact-map-title">{t.mapTitle || "Bản đồ"}</div>

              <iframe
                title="SouVN Map"
                src="https://www.google.com/maps?q=Ha%20Noi%2C%20Viet%20Nam&z=13&output=embed"
                className="contact-map-iframe"
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