import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { cartService } from "../services/cartService";
import { couponService } from "../services/couponService";
import { orderService } from "../services/orderService";
import { accountService } from "../services/accountService";
import { aiService } from "../services/aiService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const API_ORIGIN = "https://localhost:7020";

const getImageSrc = (url) => {
  if (!url) return "/no-image.png";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 ₫";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
};

const normalizeDisplayText = (value = "") => {
  return String(value || "")
    .normalize("NFC")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getProductTitle = (item) => {
  const raw = item?.productName || item?.name || item?.productSlug || "";
  const normalized = normalizeDisplayText(raw);
  return normalized || "Sản phẩm lưu niệm";
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

export default function CartPage() {
  const nav = useNavigate();
  const { language, currentLanguageName, isVietnamese } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    cartId: 0,
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [translatedItems, setTranslatedItems] = useState({});
  const [translatingCart, setTranslatingCart] = useState(false);

  const translateText = useCallback(
    async (text) => {
      if (!text || isVietnamese) return text;

      try {
        const res = await aiService.translate(text, currentLanguageName);
        return res?.data?.translatedText?.trim() || text;
      } catch {
        return text;
      }
    },
    [currentLanguageName, isVietnamese]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const [cartRes, addressRes] = await Promise.all([
        cartService.get(),
        accountService.getAddresses(),
      ]);

      const cartData = cartRes.data || {
        items: [],
        subtotal: 0,
        cartId: 0,
      };

      const addressData = addressRes.data || [];

      setCart(cartData);
      setAddresses(addressData);

      const defaultAddress = addressData.find((address) => address.isDefault);

      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
      } else if (addressData.length > 0) {
        setSelectedAddressId(String(addressData[0].id));
      } else {
        setSelectedAddressId("");
      }
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.cartLoadFailed || "Không thể tải giỏ hàng")
      );
    } finally {
      setLoading(false);
    }
  }, [t.cartLoadFailed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if ((cart.items || []).length === 0) {
        setTranslatedItems({});
        return;
      }

      if (isVietnamese) {
        const mapped = {};

        (cart.items || []).forEach((item) => {
          mapped[item.id] = {
            productTitle: getProductTitle(item),
            variantTitle:
              normalizeDisplayText(item.variantName) ||
              t.defaultVariant ||
              "Mặc định",
          };
        });

        setTranslatedItems(mapped);
        return;
      }

      try {
        setTranslatingCart(true);

        const entries = await Promise.all(
          (cart.items || []).map(async (item) => {
            const originalProductTitle = getProductTitle(item);
            const originalVariantTitle =
              normalizeDisplayText(item.variantName) ||
              t.defaultVariant ||
              "Mặc định";

            const translatedProductTitle = await translateText(
              originalProductTitle
            );

            const translatedVariantTitle = await translateText(
              originalVariantTitle
            );

            return [
              item.id,
              {
                productTitle: translatedProductTitle || originalProductTitle,
                variantTitle: translatedVariantTitle || originalVariantTitle,
              },
            ];
          })
        );

        if (!cancelled) {
          setTranslatedItems(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setTranslatingCart(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [cart.items, isVietnamese, t.defaultVariant, translateText]);

  const discountAmount = couponInfo?.isValid
    ? Number(couponInfo.discountAmount || 0)
    : 0;

  const finalTotal = useMemo(() => {
    return Math.max(0, Number(cart.subtotal || 0) - discountAmount);
  }, [cart.subtotal, discountAmount]);

  const updateQty = async (itemId, quantity) => {
    setErr("");
    setMsg("");

    const safeQty = Math.max(1, Number(quantity || 1));

    try {
      await cartService.updateItem(itemId, { quantity: safeQty });
      await load();
      setMsg(t.cartQtyUpdated || "Đã cập nhật số lượng sản phẩm");
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.cartQtyUpdateFailed || "Cập nhật số lượng thất bại"
        )
      );
    }
  };

  const removeItem = async (itemId) => {
    setErr("");
    setMsg("");

    try {
      await cartService.deleteItem(itemId);
      await load();
      setMsg(t.cartItemRemoved || "Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.cartRemoveFailed || "Xóa sản phẩm thất bại")
      );
    }
  };

  const validateCoupon = async () => {
    setErr("");
    setMsg("");
    setCouponInfo(null);

    if (!couponCode.trim()) {
      setErr(t.cartCouponRequired || "Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setCheckingCoupon(true);

      const res = await couponService.validate({
        code: couponCode.trim(),
        subtotal: cart.subtotal,
      });

      setCouponInfo(res.data);

      if (res.data?.isValid) {
        setMsg(t.cartCouponValid || "Mã giảm giá hợp lệ");
      } else {
        setErr(
          res.data?.message || t.cartCouponInvalid || "Mã giảm giá không hợp lệ"
        );
      }
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.cartCouponCheckFailed || "Kiểm tra mã giảm giá thất bại"
        )
      );
    } finally {
      setCheckingCoupon(false);
    }
  };

  const checkout = async () => {
    setErr("");
    setMsg("");

    if ((cart.items || []).length === 0) {
      setErr(t.cartEmpty || "Giỏ hàng đang trống");
      return;
    }

    if (!selectedAddressId) {
      setErr(t.cartChooseAddress || "Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    try {
      setCheckingOut(true);

      const payload = {
        shippingAddressId: Number(selectedAddressId),
        fulfillmentType: "delivery",
      };

      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }

      const res = await orderService.create(payload);
      const orderCode = res.data.orderCode;

      nav(`/payment/${orderCode}`);
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.cartCheckoutFailed || "Tạo đơn hàng thất bại")
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <MainLayout>
      <section className="section cart-page-section">
        <div className="container">
          <div className="cart-card cart-header-card">
            <div className="cart-header-top">
              <div>
                <div className="cart-kicker">
                  {t.cartHeaderSmall || "Giỏ hàng SouVN"}
                </div>

                <h2 className="cart-title">
                  {t.cartHeaderTitle || "Giỏ hàng của bạn"}
                </h2>
              </div>

              <div className="cart-count">
                {t.cartItemCount || "Số sản phẩm:"}{" "}
                <span>{cart.items?.length || 0}</span>
              </div>
            </div>
          </div>

          {translatingCart && !loading && (
            <div className="cart-alert cart-alert-info">
              {t.translating || "Đang dịch nội dung sang ngôn ngữ đã chọn..."}
            </div>
          )}

          {err && <div className="cart-alert cart-alert-error">{err}</div>}

          {msg && <div className="cart-alert cart-alert-success">{msg}</div>}

          {loading ? (
            <div className="cart-card cart-loading-card">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="cart-loading-text">
                {t.cartLoading || "Đang tải giỏ hàng..."}
              </p>
            </div>
          ) : (cart.items || []).length === 0 ? (
            <div className="cart-card cart-empty-card">
              <div className="cart-empty-icon">
                <i className="bi bi-cart-x"></i>
              </div>

              <h4 className="cart-empty-title">
                {t.cartEmptyTitle || "Giỏ hàng đang trống"}
              </h4>

              <p className="cart-empty-desc">
                {t.cartEmptyDesc || "Bạn chưa thêm sản phẩm nào vào giỏ hàng."}
              </p>

              <Link to="/products" className="cart-main-button">
                <i className="bi bi-bag"></i>
                {t.continueShopping || "Tiếp tục mua sắm"}
              </Link>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-8">
                <div className="cart-card cart-products-card">
                  <div className="cart-products-header">
                    {t.cartSelectedProducts || "Sản phẩm đã chọn"}
                  </div>

                  <div className="cart-items-list">
                    {(cart.items || []).map((item) => {
                      const productTitle =
                        translatedItems[item.id]?.productTitle ||
                        getProductTitle(item);

                      const variantTitle =
                        translatedItems[item.id]?.variantTitle ||
                        normalizeDisplayText(item.variantName) ||
                        t.defaultVariant ||
                        "Mặc định";

                      return (
                        <div key={item.id} className="cart-item">
                          <div className="row g-3 align-items-center">
                            <div className="col-md-3 col-lg-2">
                              <div className="cart-image-box">
                                <img
                                  src={getImageSrc(item.imageUrl)}
                                  alt={productTitle}
                                  className="cart-item-image"
                                  onError={(e) => {
                                    e.currentTarget.src = "/no-image.png";
                                  }}
                                />
                              </div>
                            </div>

                            <div className="col-md-9 col-lg-4">
                              <h5 className="cart-product-title">
                                {productTitle}
                              </h5>

                              <div className="cart-variant-text">
                                {t.variantType || "Phân loại:"} {variantTitle}
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                type="button"
                                className="cart-remove-button"
                              >
                                <i className="bi bi-trash3 me-1"></i>
                                {t.delete || "Xóa"}
                              </button>
                            </div>

                            <div className="col-4 col-lg-2">
                              <div className="cart-price">
                                {formatPrice(item.price)}
                              </div>
                            </div>

                            <div className="col-4 col-lg-2 d-flex justify-content-center">
                              <div className="cart-qty-box">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQty(
                                      item.id,
                                      Number(item.quantity) - 1
                                    )
                                  }
                                  disabled={Number(item.quantity) <= 1}
                                  className="cart-qty-button"
                                >
                                  -
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateQty(
                                      item.id,
                                      Number(e.target.value || 1)
                                    )
                                  }
                                  className="cart-qty-input"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQty(
                                      item.id,
                                      Number(item.quantity) + 1
                                    )
                                  }
                                  className="cart-qty-button"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="col-4 col-lg-2">
                              <div className="cart-line-total">
                                {formatPrice(item.lineTotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="cart-card cart-side-card">
                  <h4 className="cart-section-title">
                    {t.couponTitle || "Mã giảm giá"}
                  </h4>

                  <div className="d-flex gap-2">
                    <input
                      className="form-control cart-input"
                      placeholder={t.couponPlaceholder || "Nhập mã giảm giá"}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />

                    <button
                      onClick={validateCoupon}
                      disabled={checkingCoupon}
                      className="cart-apply-button"
                    >
                      {checkingCoupon
                        ? t.checking || "Đang kiểm tra..."
                        : t.apply || "Áp dụng"}
                    </button>
                  </div>

                  {couponInfo && (
                    <div
                      className={`cart-coupon-message ${
                        couponInfo.isValid ? "valid" : "invalid"
                      }`}
                    >
                      <div>
                        <strong>{t.notice || "Thông báo:"}</strong>{" "}
                        {couponInfo.message}
                      </div>

                      <div>
                        <strong>{t.discount || "Giảm giá:"}</strong>{" "}
                        {formatPrice(couponInfo.discountAmount)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="cart-card cart-side-card">
                  <h4 className="cart-section-title">
                    {t.shippingAddress || "Địa chỉ giao hàng"}
                  </h4>

                  {addresses.length === 0 ? (
                    <div className="cart-no-address">
                      {t.noShippingAddress || "Bạn chưa có địa chỉ giao hàng."}{" "}
                      <Link to="/account">
                        {t.addAddressNow || "Thêm địa chỉ ngay"}
                      </Link>
                    </div>
                  ) : (
                    <select
                      className="form-select cart-input"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      <option value="">
                        {t.chooseShippingAddress || "Chọn địa chỉ giao hàng"}
                      </option>

                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.recipientName} - {address.recipientPhone} -{" "}
                          {[
                            address.addressLine1,
                            address.district,
                            address.province,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          {address.isDefault
                            ? ` (${t.defaultAddress || "Mặc định"})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="cart-card cart-side-card">
                  <h4 className="cart-section-title">
                    {t.orderSummary || "Tóm tắt đơn hàng"}
                  </h4>

                  <div className="cart-summary-list">
                    <div className="cart-summary-row">
                      <span>{t.subtotal || "Tạm tính"}</span>
                      <strong>{formatPrice(cart.subtotal)}</strong>
                    </div>

                    <div className="cart-summary-row">
                      <span>{t.discount || "Giảm giá"}</span>
                      <strong>- {formatPrice(discountAmount)}</strong>
                    </div>

                    <hr className="cart-summary-divider" />

                    <div className="cart-summary-row cart-summary-total">
                      <span>{t.total || "Tổng cộng"}</span>
                      <strong>{formatPrice(finalTotal)}</strong>
                    </div>
                  </div>

                  <button
                    onClick={checkout}
                    disabled={checkingOut || (cart.items || []).length === 0}
                    className="cart-checkout-button"
                  >
                    {checkingOut
                      ? t.creatingOrder || "Đang tạo đơn..."
                      : t.buyNowCart || "Mua hàng"}
                  </button>

                  <Link to="/products" className="cart-outline-button">
                    {t.continueShopping || "Tiếp tục mua sắm"}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}