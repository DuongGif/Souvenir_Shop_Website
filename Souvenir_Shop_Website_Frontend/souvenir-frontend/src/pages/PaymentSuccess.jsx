import React from "react";
import { Link, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

export default function PaymentSuccess() {
  const location = useLocation();
  const orderCode = location.state?.orderCode || "";

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
              borderLeft: "5px solid #10b981",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Kết quả thanh toán
            </div>

            <h2
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#111827",
                fontSize: "clamp(24px, 4vw, 34px)",
              }}
            >
              Thanh toán thành công
            </h2>
          </div>

          <div
            style={{
              ...pageCard,
              padding: 40,
              textAlign: "center",
              maxWidth: 860,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                margin: "0 auto 20px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ecfdf5",
                color: "#10b981",
                fontSize: 42,
                border: "1px solid #a7f3d0",
              }}
            >
              <i className="bi bi-check-circle-fill"></i>
            </div>

            <h3
              style={{
                color: "#111827",
                fontWeight: 700,
                fontSize: 30,
                marginBottom: 12,
              }}
            >
              Đơn hàng của bạn đã được thanh toán thành công
            </h3>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.8,
                fontSize: 16,
                marginBottom: 20,
                maxWidth: 640,
                marginInline: "auto",
              }}
            >
              Cảm ơn bạn đã mua sắm tại SouVN. Chúng tôi đã ghi nhận thanh toán và
              sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
            </p>

            {orderCode && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  color: "#111827",
                  fontWeight: 700,
                  marginBottom: 28,
                }}
              >
                <span>Mã đơn hàng:</span>
                <span style={{ color: "#ee4d2d" }}>{orderCode}</span>
              </div>
            )}

            <div
              className="d-flex flex-wrap justify-content-center gap-3"
              style={{ marginTop: 8 }}
            >
              <Link
                to="/orders"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minWidth: 180,
                  height: 46,
                  borderRadius: 10,
                  border: "none",
                  background: "#ee4d2d",
                  color: "#fff",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <i className="bi bi-receipt"></i>
                Xem đơn hàng
              </Link>

              <Link
                to="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minWidth: 180,
                  height: 46,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <i className="bi bi-bag"></i>
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}