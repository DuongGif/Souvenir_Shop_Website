import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { reviewService } from "../services/reviewService";
import { aiService } from "../services/aiService";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

const API_ORIGIN = "https://localhost:7020";

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return "Liên hệ";
  return `${Number(price).toLocaleString("vi-VN")} ₫`;
};

const normalizeDisplayText = (value = "") => {
  return String(value || "")
    .normalize("NFC")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getProductTitle = (product) => {
  const raw = product?.name || product?.slug || "";
  const normalized = normalizeDisplayText(raw);
  return normalized || "Chi tiết sản phẩm";
};

const getCategoryLabel = (categoryId) => {
  const map = {
    1: "Quà lưu niệm",
    2: "Đồ thủ công",
    3: "Móc khóa",
    4: "Áo du lịch",
    5: "Phụ kiện",
    6: "Đặc sản",
    7: "Khác",
  };

  return map[Number(categoryId)] || "Sản phẩm lưu niệm";
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

const initialReviewForm = {
  rating: 5,
  title: "",
  content: "",
};

export default function DetailProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const { language, currentLanguageName, isVietnamese } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const [p, setP] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

  const [reviews, setReviews] = useState([]);
  const [rv, setRv] = useState(initialReviewForm);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [reviewErr, setReviewErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [translatedProductTitle, setTranslatedProductTitle] = useState("");
  const [translatedCategoryLabel, setTranslatedCategoryLabel] = useState("");
  const [translatedVariants, setTranslatedVariants] = useState({});
  const [translatedReviews, setTranslatedReviews] = useState([]);
  const [translatingPage, setTranslatingPage] = useState(false);

  const productTitle = useMemo(() => getProductTitle(p), [p]);
  const categoryLabel = useMemo(() => getCategoryLabel(p?.categoryId), [p]);

  const currentVariant = useMemo(() => {
    return (p?.variants || []).find((item) => item.id === Number(variantId)) || null;
  }, [p, variantId]);

  const displayPrice = currentVariant?.price ?? p?.basePrice ?? 0;

  const imageList = useMemo(() => {
    const rawImages = Array.isArray(p?.images) ? p.images : [];

    const normalizedImages = rawImages
      .map((img) => {
        if (!img) return "";

        if (typeof img === "string") {
          return getImageSrc(img);
        }

        return getImageSrc(
          img.imageUrl || img.url || img.imagePath || img.path || ""
        );
      })
      .filter(Boolean);

    if (normalizedImages.length > 0) return normalizedImages;
    if (p?.imageUrl) return [getImageSrc(p.imageUrl)];

    return ["https://via.placeholder.com/800x600?text=Souvenir+Shop"];
  }, [p]);

  const displayProductTitle = translatedProductTitle || productTitle;
  const displayCategoryLabel = translatedCategoryLabel || categoryLabel;

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

  const loadReviews = useCallback(async () => {
    setReviewErr("");

    try {
      const res = await reviewService.byProduct(id);
      setReviews(res.data || []);
    } catch (ex) {
      setReviews([]);
      setReviewErr(
        getErrorMessage(
          ex,
          t.cannotLoadReviews || "Không thể tải đánh giá sản phẩm"
        )
      );
    }
  }, [id, t.cannotLoadReviews]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await productService.detail(id);

        setP(res.data);
        setVariantId(res.data?.variants?.[0]?.id ?? null);
      } catch (ex) {
        setErr(
          getErrorMessage(
            ex,
            t.cannotLoadProductDetails || "Không thể tải chi tiết sản phẩm"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    loadReviews();
  }, [id, loadReviews, t.cannotLoadProductDetails]);

  useEffect(() => {
    if (!msg && !err) return;

    const timer = setTimeout(() => {
      setMsg("");
      setErr("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [msg, err]);

  useEffect(() => {
    if (imageList.length > 0) {
      setSelectedImage(imageList[0]);
    }
  }, [imageList]);

  useEffect(() => {
    let cancelled = false;

    const translatePageContent = async () => {
      if (!p) return;

      if (isVietnamese) {
        const originalVariants = {};

        (p?.variants || []).forEach((variant) => {
          originalVariants[variant.id] = normalizeDisplayText(
            variant.variantName
          );
        });

        setTranslatedProductTitle(productTitle);
        setTranslatedCategoryLabel(categoryLabel);
        setTranslatedVariants(originalVariants);
        setTranslatedReviews(reviews);
        return;
      }

      try {
        setTranslatingPage(true);

        const nextProductTitle = await translateText(productTitle);
        const nextCategoryLabel = await translateText(categoryLabel);

        const variantEntries = await Promise.all(
          (p?.variants || []).map(async (variant) => {
            const translatedVariantName = await translateText(
              normalizeDisplayText(variant.variantName)
            );

            return [variant.id, translatedVariantName];
          })
        );

        const nextReviews = await Promise.all(
          (reviews || []).map(async (review) => {
            const translatedTitle = await translateText(
              normalizeDisplayText(review.title)
            );

            const translatedContent = await translateText(
              normalizeDisplayText(review.content)
            );

            const translatedReplyContent = review.replyContent
              ? await translateText(normalizeDisplayText(review.replyContent))
              : "";

            return {
              ...review,
              translatedTitle,
              translatedContent,
              translatedReplyContent,
            };
          })
        );

        if (!cancelled) {
          setTranslatedProductTitle(nextProductTitle);
          setTranslatedCategoryLabel(nextCategoryLabel);
          setTranslatedVariants(Object.fromEntries(variantEntries));
          setTranslatedReviews(nextReviews);
        }
      } finally {
        if (!cancelled) {
          setTranslatingPage(false);
        }
      }
    };

    translatePageContent();

    return () => {
      cancelled = true;
    };
  }, [
    p,
    reviews,
    language,
    isVietnamese,
    productTitle,
    categoryLabel,
    translateText,
  ]);

  const addToCart = async () => {
    setMsg("");
    setErr("");

    if (!token) {
      nav("/login");
      return;
    }

    if (!variantId) {
      setErr(t.pleaseChooseVariant || "Vui lòng chọn biến thể sản phẩm.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setAddingCart(true);

      await cartService.addItem({
        variantId,
        quantity: Number(qty),
      });

      setMsg(t.addedToCartSuccess || "Đã thêm sản phẩm vào giỏ hàng.");
      setQty(1);

      window.dispatchEvent(new Event("cart-updated"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.addToCartFailed || "Thêm vào giỏ hàng thất bại"
        )
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAddingCart(false);
    }
  };

  const handleChatProduct = () => {
    if (!p) return;

    const payload = {
      productId: Number(id),
      name: translatedProductTitle || productTitle,
      slug: p.slug || "",
      imageUrl: selectedImage || imageList?.[0] || "",
      price: displayPrice,
      variantName:
        translatedVariants[currentVariant?.id] ||
        currentVariant?.variantName ||
        "",
      url: `/products/${id}`,
    };

    window.dispatchEvent(
      new CustomEvent("souvn:chat-share-product", {
        detail: payload,
      })
    );

    setMsg(t.chatOpenedAndShared || "Đã mở chat và gửi sản phẩm để xin tư vấn.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitReview = async () => {
    setMsg("");
    setErr("");
    setReviewErr("");

    try {
      setSubmittingReview(true);

      await reviewService.create({
        productId: Number(id),
        ...rv,
      });

      setMsg(t.reviewSubmittedSuccess || "Đánh giá đã được gửi thành công");
      setRv(initialReviewForm);

      await loadReviews();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.submitReviewFailed || "Gửi đánh giá thất bại")
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <MainLayout>
      <section className="section product-detail-page-section">
        <div className="container">
          <div className="product-detail-card product-detail-header-card">
            <div className="product-detail-header-top">
              <div>
                <div className="product-detail-kicker">
                  {t.productDetails || "Chi tiết sản phẩm"}
                </div>

                <h2 className="product-detail-header-title">
                  {displayProductTitle}
                </h2>
              </div>

              <Link to="/products" className="product-detail-back-link">
                {t.backToProducts || "← Quay lại danh sách sản phẩm"}
              </Link>
            </div>
          </div>

          {translatingPage && !loading && (
            <div
              className="product-detail-alert product-detail-alert-info"
              role="alert"
            >
              {t.translating || "Đang dịch nội dung sang ngôn ngữ đã chọn..."}
            </div>
          )}

          {err && (
            <div
              className="product-detail-alert product-detail-alert-error"
              role="alert"
            >
              {err}
            </div>
          )}

          {msg && (
            <div
              className="product-detail-alert product-detail-alert-success"
              role="alert"
            >
              {msg}
            </div>
          )}

          {loading ? (
            <div className="product-detail-card product-detail-loading-card">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="product-detail-loading-text">
                {t.loadingProduct || "Đang tải chi tiết sản phẩm..."}
              </p>
            </div>
          ) : !p ? (
            <div className="product-detail-alert product-detail-alert-warning">
              {t.productNotFound || "Không tìm thấy sản phẩm."}
            </div>
          ) : (
            <>
              <div className="row g-4 align-items-start">
                <div className="col-lg-5">
                  <div className="product-detail-card product-detail-gallery-card">
                    <div className="product-detail-main-image-box">
                      <img
                        src={selectedImage || imageList[0]}
                        alt={displayProductTitle}
                        className="product-detail-main-image"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/800x600?text=No+Image";
                        }}
                      />
                    </div>

                    {imageList.length > 1 && (
                      <div className="product-detail-thumb-grid">
                        {imageList.map((img, index) => {
                          const isActive = selectedImage === img;

                          return (
                            <button
                              key={`${img}-${index}`}
                              type="button"
                              onClick={() => setSelectedImage(img)}
                              className={`product-detail-thumb-button ${
                                isActive ? "active" : ""
                              }`}
                            >
                              <img
                                src={img}
                                alt={`${displayProductTitle}-${index + 1}`}
                                className="product-detail-thumb-image"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/200x150?text=No+Image";
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="product-detail-card product-detail-info-card">
                    <div className="product-detail-category-pill">
                      <i className="bi bi-bag-heart"></i>
                      {displayCategoryLabel}
                    </div>

                    <h1 className="product-detail-name">
                      {displayProductTitle}
                    </h1>

                    <div className="product-detail-price-box">
                      <div className="product-detail-price">
                        {formatPrice(displayPrice)}
                      </div>

                      {p.basePrice !== null && p.basePrice !== undefined && (
                        <div className="product-detail-base-price">
                          {t.basePrice || "Giá gốc:"} {formatPrice(p.basePrice)}
                        </div>
                      )}
                    </div>

                    <div className="product-detail-option-row">
                      <div className="product-detail-option-label">
                        {t.variant || "Biến thể"}
                      </div>

                      <select
                        className="form-select product-detail-input"
                        value={variantId ?? ""}
                        onChange={(e) => setVariantId(Number(e.target.value))}
                        disabled={(p.variants || []).length === 0}
                      >
                        {(p.variants || []).length > 0 ? (
                          (p.variants || []).map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {(translatedVariants[variant.id] ||
                                normalizeDisplayText(variant.variantName)) +
                                " - " +
                                formatPrice(variant.price ?? p.basePrice)}
                            </option>
                          ))
                        ) : (
                          <option value="">
                            {t.noVariant || "Không có biến thể"}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="product-detail-option-row quantity-row">
                      <div className="product-detail-option-label">
                        {t.quantity || "Số lượng"}
                      </div>

                      <div className="product-detail-qty-box">
                        <button
                          type="button"
                          onClick={() =>
                            setQty((prev) => Math.max(1, Number(prev) - 1))
                          }
                          className="product-detail-qty-button"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) =>
                            setQty(Math.max(1, Number(e.target.value || 1)))
                          }
                          className="product-detail-qty-input"
                        />

                        <button
                          type="button"
                          onClick={() => setQty((prev) => Number(prev) + 1)}
                          className="product-detail-qty-button"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="product-detail-actions">
                      <button
                        type="button"
                        onClick={addToCart}
                        disabled={addingCart || !variantId}
                        className="product-detail-action-button product-detail-add-cart"
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        {addingCart
                          ? t.adding || "Đang thêm..."
                          : t.addToCart || "Thêm vào giỏ hàng"}
                      </button>

                      <button
                        type="button"
                        onClick={handleChatProduct}
                        className="product-detail-action-button product-detail-chat"
                      >
                        <i className="bi bi-chat-dots me-2"></i>
                        {t.chatAdvice || "Chat tư vấn sản phẩm"}
                      </button>

                      <Link
                        to="/cart"
                        className="product-detail-action-button product-detail-view-cart"
                      >
                        <i className="bi bi-bag-check me-2"></i>
                        {t.viewCart || "Xem giỏ hàng"}
                      </Link>
                    </div>

                    <div className="product-detail-meta">
                      <div>
                        <strong>{t.numberOfVariants || "Số biến thể:"}</strong>{" "}
                        {p.variants?.length || 0}
                      </div>

                      <div>
                        <strong>{t.numberOfImages || "Số ảnh:"}</strong>{" "}
                        {imageList.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-lg-7">
                  <div className="product-detail-card product-detail-review-card">
                    <h3 className="product-detail-section-title">
                      {t.productReviews || "Đánh giá sản phẩm"}
                    </h3>

                    {reviewErr && (
                      <div
                        className="product-detail-alert product-detail-alert-warning"
                        role="alert"
                      >
                        {reviewErr}
                      </div>
                    )}

                    {(translatedReviews || []).length === 0 ? (
                      <div className="product-detail-empty-box">
                        {t.noReviews || "Chưa có đánh giá nào cho sản phẩm này."}
                      </div>
                    ) : (
                      <div className="product-detail-review-list">
                        {(translatedReviews || []).map((review) => (
                          <div
                            key={review.id}
                            className="product-detail-review-item"
                          >
                            <div className="product-detail-review-head">
                              <div className="product-detail-review-title">
                                <span className="product-detail-stars">
                                  {"★".repeat(Number(review.rating || 0))}
                                </span>{" "}
                                {review.translatedTitle ||
                                  normalizeDisplayText(review.title)}
                              </div>
                            </div>

                            <div className="product-detail-review-content">
                              {review.translatedContent ||
                                normalizeDisplayText(review.content)}
                            </div>

                            {review.replyContent && (
                              <div className="product-detail-shop-reply">
                                <strong>
                                  {t.shopReply || "Phản hồi từ shop:"}
                                </strong>{" "}
                                {review.translatedReplyContent ||
                                  normalizeDisplayText(review.replyContent)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="product-detail-card product-detail-review-card">
                    <h3 className="product-detail-section-title">
                      {t.writeReview || "Viết đánh giá"}
                    </h3>

                    {!token ? (
                      <div className="product-detail-login-box">
                        {t.loginRequiredPrefix || "Bạn cần "}
                        <Link to="/login">{t.login || "đăng nhập"}</Link>
                        {t.loginRequiredSuffix || " để gửi đánh giá."}
                      </div>
                    ) : (
                      <div className="d-grid gap-3">
                        <div>
                          <label className="form-label product-detail-form-label">
                            {t.rating || "Số sao"}
                          </label>

                          <input
                            type="number"
                            min={1}
                            max={5}
                            className="form-control product-detail-input"
                            value={rv.rating}
                            onChange={(e) =>
                              setRv({
                                ...rv,
                                rating: Number(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="form-label product-detail-form-label">
                            {t.title || "Tiêu đề"}
                          </label>

                          <input
                            className="form-control product-detail-input"
                            placeholder={
                              t.reviewTitlePlaceholder ||
                              "Nhập tiêu đề đánh giá"
                            }
                            value={rv.title}
                            onChange={(e) =>
                              setRv({
                                ...rv,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="form-label product-detail-form-label">
                            {t.content || "Nội dung"}
                          </label>

                          <textarea
                            className="form-control product-detail-textarea"
                            rows={5}
                            placeholder={
                              t.reviewContentPlaceholder ||
                              "Chia sẻ cảm nhận của bạn về sản phẩm"
                            }
                            value={rv.content}
                            onChange={(e) =>
                              setRv({
                                ...rv,
                                content: e.target.value,
                              })
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={submitReview}
                          disabled={submittingReview}
                          className="product-detail-submit-review"
                        >
                          {submittingReview
                            ? t.submitting || "Đang gửi..."
                            : t.submitReview || "Gửi đánh giá"}
                        </button>
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