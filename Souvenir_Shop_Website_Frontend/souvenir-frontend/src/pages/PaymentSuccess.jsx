import { Link, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

export default function PaymentSuccess() {
  const location = useLocation();
  const orderCode = location.state?.orderCode || "";

  return (
    <MainLayout>
      <section className="section payment-success-section">
        <div className="container">
          <div className="payment-success-card payment-success-header-card">
            <div className="payment-success-kicker">Kết quả thanh toán</div>

            <h2 className="payment-success-title">Thanh toán thành công</h2>
          </div>

          <div className="payment-success-card payment-success-content-card">
            <div className="payment-success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>

            <h3 className="payment-success-heading">
              Đơn hàng của bạn đã được thanh toán thành công
            </h3>

            <p className="payment-success-desc">
              Cảm ơn bạn đã mua sắm tại SouVN. Chúng tôi đã ghi nhận thanh toán
              và sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
            </p>

            {orderCode && (
              <div className="payment-success-order-code">
                <span>Mã đơn hàng:</span>
                <strong>{orderCode}</strong>
              </div>
            )}

            <div className="payment-success-actions">
              <Link
                to="/orders"
                className="payment-success-button payment-success-button-primary"
              >
                <i className="bi bi-receipt"></i>
                Xem đơn hàng
              </Link>

              <Link
                to="/products"
                className="payment-success-button payment-success-button-secondary"
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