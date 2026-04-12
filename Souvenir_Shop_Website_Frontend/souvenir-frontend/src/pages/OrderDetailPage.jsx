import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { cartService } from "../services/cartService";

const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

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

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending" || s === "cho_xu_ly" || s === "cho_xac_nhan") {
    return { text: "Chờ xử lý", bg: "#fff7ed", color: "#c2410c" };
  }

  if (s === "confirmed" || s === "da_xac_nhan") {
    return { text: "Đã xác nhận", bg: "#eff6ff", color: "#1d4ed8" };
  }

  if (s === "paid" || s === "da_thanh_toan") {
    return { text: "Đã thanh toán", bg: "#ecfdf5", color: "#047857" };
  }

  if (s === "shipping" || s === "dang_giao") {
    return { text: "Đang giao hàng", bg: "#eff6ff", color: "#1d4ed8" };
  }

  if (s === "completed" || s === "hoan_thanh") {
    return { text: "Hoàn thành", bg: "#ecfdf5", color: "#047857" };
  }

  if (s === "cancelled" || s === "canceled" || s === "da_huy") {
    return { text: "Đã hủy", bg: "#fef2f2", color: "#b91c1c" };
  }

  return {
    text: "Không xác định",
    bg: "#f3f4f6",
    color: "#374151",
  };
};

const getFulfillmentText = (value) => {
  const s = String(value || "").toLowerCase();

  if (s === "delivery" || s === "giao_hang") return "Giao hàng tận nơi";
  if (s === "pickup" || s === "nhan_tai_diem") return "Nhận tại điểm";
  if (s === "hotel" || s === "hotel_delivery" || s === "giao_khach_san") {
    return "Giao tại khách sạn";
  }

  return value || "Không xác định";
};

const getPaymentMethodText = (method) => {
  const s = String(method || "").toLowerCase();

  if (s === "cod") return "Thanh toán khi nhận hàng";
  if (s === "bank_transfer") return "Chuyển khoản ngân hàng";

  return "Chưa có";
};

const getPaymentStatusText = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return "Chờ thanh toán";
  if (s === "paid") return "Đã thanh toán";
  if (s === "failed") return "Thanh toán thất bại";
  if (s === "expired") return "Đã hết hạn";
  if (s === "refunded") return "Đã hoàn tiền";

  return "Chưa có";
};

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const shopeeButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "#ee4d2d",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  width: "100%",
};

const secondaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  width: "100%",
};

export default function OrderDetailPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setPaymentLoading(true);
      setErr("");

      try {
        const orderRes = await orderService.byCode(orderCode);
        setOrder(orderRes.data);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải chi tiết đơn hàng."));
      } finally {
        setLoading(false);
      }

      try {
        const paymentRes = await paymentService.byOrderCode(orderCode);
        setPayment(paymentRes.data);
      } catch {
        setPayment(null);
      } finally {
        setPaymentLoading(false);
      }
    };

    loadData();
  }, [orderCode]);

  const badge = useMemo(() => getStatusBadge(order?.status), [order?.status]);
  const status = String(order?.status || "").toLowerCase();

  const isPending =
    status === "pending" || status === "cho_xu_ly" || status === "cho_xac_nhan";

  const isCanceled =
    status === "cancelled" || status === "canceled" || status === "da_huy";

  const isCompleted =
    status === "completed" || status === "hoan_thanh";

  const paymentMethod = String(payment?.paymentMethod || "").toLowerCase();
  const isCod = paymentMethod === "cod";
  const isBankTransfer = paymentMethod === "bank_transfer";

  const canRepurchase = isCanceled || isCompleted;
  const canReview = isCompleted;
  const canContinuePayment = isPending && (!payment || isBankTransfer);

  const goToProduct = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy mã sản phẩm.");
      return;
    }

    navigate(`/products/${item.productId}`);
  };

  const goToReview = (item) => {
    if (!item?.productId) {
      setErr("Không tìm thấy mã sản phẩm để đánh giá.");
      return;
    }

    navigate(`/products/${item.productId}?review=1`);
  };

  const handleContinuePayment = async () => {
    if (!order?.orderCode) return;

    try {
      setActionLoading(true);
      setErr("");

      const res = await paymentService.create({
        orderCode: order.orderCode,
        paymentMethod: "bank_transfer",
      });

      const paymentData = res?.data;
      setPayment(paymentData || null);

      if (paymentData?.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
        return;
      }

      navigate(`/payment/${order.orderCode}`);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tiếp tục thanh toán đơn hàng này."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyAgain = async () => {
    try {
      setActionLoading(true);
      setErr("");

      const items = order?.items || [];
      let addedCount = 0;

      for (const item of items) {
        if (!item?.variantId) continue;

        await cartService.addItem({
          variantId: item.variantId,
          quantity: item.quantity || 1,
        });

        addedCount++;
      }

      if (addedCount === 0) {
        setErr("Không thể mua lại vì đơn hàng chưa có dữ liệu biến thể sản phẩm.");
        return;
      }

      navigate("/cart");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể mua lại đơn hàng này."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MainLayout>
      <section
        className="section"
        style={{
          background: "#f5f5f5",
          paddingTop: 32,
          paddingBottom: 48,
          minHeight: "100vh",
        }}
      >
        <div className="container">
          <div className="mb-3">
            <Link
              to="/orders"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Quay lại danh sách đơn hàng
            </Link>
          </div>

          {err && (
            <div
              className="alert mb-4"
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

          {loading ? (
            <div className="text-center py-5" style={{ ...pageCard, padding: 40 }}>
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                Đang tải chi tiết đơn hàng...
              </p>
            </div>
          ) : !order ? (
            <div
              className="alert"
              style={{
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fdba74",
                borderRadius: 12,
              }}
            >
              Không tìm thấy đơn hàng.
            </div>
          ) : (
            <>
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
                      }}
                    >
                      Mã đơn hàng
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: "#111827",
                        fontSize: "clamp(24px, 4vw, 34px)",
                      }}
                    >
                      {order.orderCode}
                    </h2>
                  </div>

                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-4">
                  <div style={{ ...pageCard, padding: 20 }}>
                    <h3
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 16,
                        fontSize: 22,
                      }}
                    >
                      Thông tin đơn hàng
                    </h3>

                    <div style={{ color: "#4b5563", lineHeight: 1.9 }}>
                      <div>
                        <strong style={{ color: "#111827" }}>Mã đơn:</strong>{" "}
                        {order.orderCode}
                      </div>

                      {order.createdAt && (
                        <div>
                          <strong style={{ color: "#111827" }}>Ngày tạo:</strong>{" "}
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </div>
                      )}

                      {order.fulfillmentType && (
                        <div>
                          <strong style={{ color: "#111827" }}>Hình thức nhận:</strong>{" "}
                          {getFulfillmentText(order.fulfillmentType)}
                        </div>
                      )}
                    </div>

                    <hr />

                    <h4
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 12,
                        fontSize: 18,
                      }}
                    >
                      Thanh toán
                    </h4>

                    {paymentLoading ? (
                      <div style={{ color: "#6b7280", marginBottom: 14 }}>
                        Đang tải thông tin thanh toán...
                      </div>
                    ) : payment ? (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 14,
                          borderRadius: 12,
                          background: "#fafafa",
                          border: "1px solid #ececec",
                          color: "#4b5563",
                          lineHeight: 1.9,
                        }}
                      >
                        <div>
                          <strong style={{ color: "#111827" }}>Phương thức:</strong>{" "}
                          {getPaymentMethodText(payment.paymentMethod)}
                        </div>
                        <div>
                          <strong style={{ color: "#111827" }}>Trạng thái:</strong>{" "}
                          {getPaymentStatusText(payment.status)}
                        </div>
                        <div>
                          <strong style={{ color: "#111827" }}>Số tiền:</strong>{" "}
                          {formatPrice(payment.amount)}
                        </div>

                        {payment.bankName && (
                          <div>
                            <strong style={{ color: "#111827" }}>Ngân hàng:</strong>{" "}
                            {payment.bankName}
                          </div>
                        )}

                        {payment.accountName && (
                          <div>
                            <strong style={{ color: "#111827" }}>Chủ tài khoản:</strong>{" "}
                            {payment.accountName}
                          </div>
                        )}

                        {payment.accountNo && (
                          <div>
                            <strong style={{ color: "#111827" }}>Số tài khoản:</strong>{" "}
                            {payment.accountNo}
                          </div>
                        )}

                        {payment.transactionCode && (
                          <div>
                            <strong style={{ color: "#111827" }}>Nội dung chuyển khoản:</strong>{" "}
                            {payment.transactionCode}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 14,
                          borderRadius: 12,
                          background: "#fafafa",
                          border: "1px solid #ececec",
                          color: "#6b7280",
                        }}
                      >
                        Chưa có thông tin thanh toán.
                      </div>
                    )}

                    {isPending && isCod && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 14,
                          borderRadius: 12,
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          color: "#92400e",
                          fontWeight: 600,
                        }}
                      >
                        Đơn hàng này thanh toán khi nhận hàng, bạn không cần thanh toán trước.
                      </div>
                    )}

                    <hr />

                    <div className="d-grid gap-2 mb-4" style={{ color: "#374151" }}>
                      <div className="d-flex justify-content-between">
                        <span>Tạm tính</span>
                        <strong>{formatPrice(order.subtotal)}</strong>
                      </div>

                      {order.shippingFee !== undefined && order.shippingFee !== null && (
                        <div className="d-flex justify-content-between">
                          <span>Phí vận chuyển</span>
                          <strong>{formatPrice(order.shippingFee)}</strong>
                        </div>
                      )}

                      <div
                        className="d-flex justify-content-between"
                        style={{
                          fontSize: 18,
                          color: "#ee4d2d",
                          fontWeight: 800,
                        }}
                      >
                        <span>Tổng thanh toán</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      {canContinuePayment && (
                        <button
                          type="button"
                          onClick={handleContinuePayment}
                          disabled={actionLoading}
                          style={shopeeButton}
                        >
                          <i className="bi bi-credit-card"></i>
                          {actionLoading ? "Đang xử lý..." : "Thanh toán tiếp"}
                        </button>
                      )}

                      {canRepurchase && (
                        <button
                          type="button"
                          onClick={handleBuyAgain}
                          disabled={actionLoading}
                          style={secondaryButton}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                          {actionLoading ? "Đang xử lý..." : "Mua lại"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div style={{ ...pageCard, padding: 20 }}>
                    <h3
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 18,
                        fontSize: 22,
                      }}
                    >
                      Sản phẩm trong đơn hàng
                    </h3>

                    {(order.items || []).length === 0 ? (
                      <p style={{ color: "#6b7280", marginBottom: 0 }}>
                        Không có sản phẩm nào trong đơn hàng này.
                      </p>
                    ) : (
                      <div className="d-grid gap-3">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid #eee",
                              borderRadius: 14,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div className="row g-3 align-items-center">
                              <div className="col-md-8">
                                <h5
                                  style={{
                                    marginBottom: 8,
                                    color: "#111827",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.productName || "Sản phẩm"}
                                </h5>

                                <div style={{ color: "#4b5563", lineHeight: 1.8 }}>
                                  <div>
                                    <strong style={{ color: "#111827" }}>Biến thể:</strong>{" "}
                                    {item.variantName || "Mặc định"}
                                  </div>
                                  <div>
                                    <strong style={{ color: "#111827" }}>Số lượng:</strong>{" "}
                                    {item.quantity}
                                  </div>
                                  <div>
                                    <strong style={{ color: "#111827" }}>Đơn giá:</strong>{" "}
                                    {formatPrice(item.unitPrice)}
                                  </div>
                                  <div>
                                    <strong style={{ color: "#111827" }}>Thành tiền:</strong>{" "}
                                    {formatPrice(item.lineTotal)}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4 text-md-end">
                                <div
                                  style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: "#ee4d2d",
                                    marginBottom: 12,
                                  }}
                                >
                                  {formatPrice(item.lineTotal)}
                                </div>

                                <div className="d-flex flex-column gap-2 align-items-md-end">
                                  {(isCanceled || isCompleted) && (
                                    <button
                                      type="button"
                                      onClick={() => goToProduct(item)}
                                      style={secondaryButton}
                                    >
                                      <i className="bi bi-box-arrow-up-right"></i>
                                      Xem lại sản phẩm
                                    </button>
                                  )}

                                  {canReview && (
                                    <button
                                      type="button"
                                      onClick={() => goToReview(item)}
                                      style={shopeeButton}
                                    >
                                      <i className="bi bi-star-fill"></i>
                                      Đánh giá sản phẩm
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}