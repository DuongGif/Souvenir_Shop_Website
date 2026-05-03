import React, { useEffect, useMemo, useState } from "react";
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
  return Number(price).toLocaleString("vi-VN") + " ₫";
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
  const [rv, setRv] = useState({ rating: 5, title: "", content: "" });

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

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await productService.detail(id);
        setP(res.data);
        setVariantId(res.data?.variants?.[0]?.id ?? null);
      } catch (ex) {
        setErr(getErrorMessage(ex, t.cannotLoadProductDetails || "Không thể tải chi tiết sản phẩm"));
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      setReviewErr("");

      try {
        const rr = await reviewService.byProduct(id);
        setReviews(rr.data || []);
      } catch (ex) {
        setReviews([]);
        setReviewErr(getErrorMessage(ex, t.cannotLoadReviews || "Không thể tải đánh giá sản phẩm"));
      }
    };

    loadProduct();
    loadReviews();
  }, [id, t.cannotLoadProductDetails, t.cannotLoadReviews]);

  useEffect(() => {
    if (!msg && !err) return;

    const timer = setTimeout(() => {
      setMsg("");
      setErr("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [msg, err]);

  const currentVariant = useMemo(() => {
    return (p?.variants || []).find((v) => v.id === Number(variantId)) || null;
  }, [p, variantId]);

  const productTitle = getProductTitle(p);
  const categoryLabel = getCategoryLabel(p?.categoryId);

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

  useEffect(() => {
    if (imageList.length > 0) {
      setSelectedImage(imageList[0]);
    }
  }, [imageList]);

  useEffect(() => {
    let cancelled = false;

    const translateText = async (text) => {
      if (!text || isVietnamese) return text;

      try {
        const res = await aiService.translate(text, currentLanguageName);
        return res?.data?.translatedText?.trim() || text;
      } catch {
        return text;
      }
    };

    const translatePageContent = async () => {
      if (!p) return;

      if (isVietnamese) {
        setTranslatedProductTitle(productTitle);
        setTranslatedCategoryLabel(categoryLabel);

        const originalVariants = {};
        (p?.variants || []).forEach((v) => {
          originalVariants[v.id] = normalizeDisplayText(v.variantName);
        });
        setTranslatedVariants(originalVariants);
        setTranslatedReviews(reviews);
        return;
      }

      try {
        setTranslatingPage(true);

        const nextProductTitle = await translateText(productTitle);
        const nextCategoryLabel = await translateText(categoryLabel);

        const variantEntries = await Promise.all(
          (p?.variants || []).map(async (v) => {
            const translatedVariantName = await translateText(
              normalizeDisplayText(v.variantName)
            );
            return [v.id, translatedVariantName];
          })
        );

        const nextVariants = Object.fromEntries(variantEntries);

        const nextReviews = await Promise.all(
          (reviews || []).map(async (r) => {
            const translatedTitle = await translateText(
              normalizeDisplayText(r.title)
            );
            const translatedContent = await translateText(
              normalizeDisplayText(r.content)
            );
            const translatedReplyContent = r.replyContent
              ? await translateText(normalizeDisplayText(r.replyContent))
              : "";

            return {
              ...r,
              translatedTitle,
              translatedContent,
              translatedReplyContent,
            };
          })
        );

        if (!cancelled) {
          setTranslatedProductTitle(nextProductTitle);
          setTranslatedCategoryLabel(nextCategoryLabel);
          setTranslatedVariants(nextVariants);
          setTranslatedReviews(nextReviews);
        }
      } finally {
        if (!cancelled) setTranslatingPage(false);
      }
    };

    translatePageContent();

    return () => {
      cancelled = true;
    };
  }, [p, reviews, language, currentLanguageName, isVietnamese, productTitle, categoryLabel]);

  const displayPrice = currentVariant?.price ?? p?.basePrice ?? 0;

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
      setErr(getErrorMessage(ex, t.addToCartFailed || "Thêm vào giỏ hàng thất bại"));
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
      setRv({ rating: 5, title: "", content: "" });

      try {
        const rr = await reviewService.byProduct(id);
        setReviews(rr.data || []);
      } catch (ex) {
        setReviews([]);
        setReviewErr(getErrorMessage(ex, t.cannotReloadReviews || "Không thể tải lại danh sách đánh giá"));
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setErr(getErrorMessage(ex, t.submitReviewFailed || "Gửi đánh giá thất bại"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const displayProductTitle = translatedProductTitle || productTitle;
  const displayCategoryLabel = translatedCategoryLabel || categoryLabel;

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
              padding: 20,
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
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  {t.productDetails || "Chi tiết sản phẩm"}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                    textTransform: "none",
                    letterSpacing: 0,
                    wordBreak: "break-word",
                  }}
                >
                  {displayProductTitle}
                </h2>
              </div>

              <Link
                to="/products"
                style={{
                  color: "#ee4d2d",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {t.backToProducts || "← Quay lại danh sách sản phẩm"}
              </Link>
            </div>
          </div>

          {translatingPage && !loading && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                borderRadius: 12,
              }}
            >
              {t.translating || "Đang dịch nội dung sang ngôn ngữ đã chọn..."}
            </div>
          )}

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

          {msg && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
              }}
            >
              {msg}
            </div>
          )}

          {loading ? (
            <div style={{ ...pageCard, padding: 40 }} className="text-center">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                {t.loadingProduct || "Đang tải chi tiết sản phẩm..."}
              </p>
            </div>
          ) : !p ? (
            <div
              className="alert"
              style={{
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fed7aa",
                borderRadius: 12,
              }}
            >
              {t.productNotFound || "Không tìm thấy sản phẩm."}
            </div>
          ) : (
            <>
              <div className="row g-4 align-items-start">
                <div className="col-lg-5">
                  <div style={{ ...pageCard, padding: 16 }}>
                    <div
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 14,
                        border: "1px solid #f1f5f9",
                        background: "#fff",
                      }}
                    >
                      <img
                        src={selectedImage || imageList[0]}
                        alt={displayProductTitle}
                        style={{
                          width: "100%",
                          height: 480,
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/800x600?text=No+Image";
                        }}
                      />
                    </div>

                    {imageList.length > 1 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {imageList.map((img, index) => (
                          <button
                            key={`${img}-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(img)}
                            style={{
                              border:
                                selectedImage === img
                                  ? "2px solid #ee4d2d"
                                  : "1px solid #e5e7eb",
                              borderRadius: 12,
                              padding: 4,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <img
                              src={img}
                              alt={`${displayProductTitle}-${index + 1}`}
                              style={{
                                width: "100%",
                                height: 74,
                                objectFit: "cover",
                                borderRadius: 8,
                                display: "block",
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/200x150?text=No+Image";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-7">
                  <div style={{ ...pageCard, padding: 24 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#fff7ed",
                        color: "#c2410c",
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 14,
                      }}
                    >
                      <i className="bi bi-bag-heart"></i>
                      {displayCategoryLabel}
                    </div>

                    <h1
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 16,
                        fontSize: "clamp(24px, 4vw, 32px)",
                        lineHeight: 1.4,
                        textTransform: "none",
                        letterSpacing: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      {displayProductTitle}
                    </h1>

                    <div
                      style={{
                        background: "#fafafa",
                        borderRadius: 14,
                        padding: "18px 20px",
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 800,
                          color: "#ee4d2d",
                          lineHeight: 1.2,
                        }}
                      >
                        {formatPrice(displayPrice)}
                      </div>

                      {p.basePrice !== null && p.basePrice !== undefined && (
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 14,
                            marginTop: 8,
                          }}
                        >
                          {t.basePrice || "Giá gốc:"} {formatPrice(p.basePrice)}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr",
                        gap: 14,
                        alignItems: "center",
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        {t.variant || "Biến thể"}
                      </div>

                      <div>
                        <select
                          className="form-select"
                          value={variantId ?? ""}
                          onChange={(e) => setVariantId(Number(e.target.value))}
                          style={inputStyle}
                          disabled={(p.variants || []).length === 0}
                        >
                          {(p.variants || []).length > 0 ? (
                            (p.variants || []).map((v) => (
                              <option key={v.id} value={v.id}>
                                {(translatedVariants[v.id] ||
                                  normalizeDisplayText(v.variantName)) +
                                  " - " +
                                  formatPrice(v.price ?? p.basePrice)}
                              </option>
                            ))
                          ) : (
                            <option value="">
                              {t.noVariant || "Không có biến thể"}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr",
                        gap: 14,
                        alignItems: "center",
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        {t.quantity || "Số lượng"}
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#fff",
                          width: "fit-content",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setQty((prev) => Math.max(1, Number(prev) - 1))}
                          style={{
                            width: 38,
                            height: 38,
                            border: "none",
                            background: "#fff",
                            color: "#374151",
                            fontWeight: 700,
                          }}
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
                          style={{
                            width: 60,
                            height: 38,
                            border: "none",
                            borderLeft: "1px solid #e5e7eb",
                            borderRight: "1px solid #e5e7eb",
                            textAlign: "center",
                            outline: "none",
                            color: "#111827",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setQty((prev) => Number(prev) + 1)}
                          style={{
                            width: 38,
                            height: 38,
                            border: "none",
                            background: "#fff",
                            color: "#374151",
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="d-flex gap-3 flex-wrap">
                      <button
                        onClick={addToCart}
                        disabled={addingCart || !variantId}
                        style={{
                          minWidth: 220,
                          height: 48,
                          borderRadius: 10,
                          border: "1px solid #ee4d2d",
                          background: "#fff1ee",
                          color: "#ee4d2d",
                          fontWeight: 800,
                        }}
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        {addingCart
                          ? (t.adding || "Đang thêm...")
                          : (t.addToCart || "Thêm vào giỏ hàng")}
                      </button>

                      <button
                        type="button"
                        onClick={handleChatProduct}
                        style={{
                          minWidth: 220,
                          height: 48,
                          borderRadius: 10,
                          border: "1px solid #ee4d2d",
                          background: "#ffffff",
                          color: "#ee4d2d",
                          fontWeight: 800,
                        }}
                      >
                        <i className="bi bi-chat-dots me-2"></i>
                        {t.chatAdvice || "Chat tư vấn sản phẩm"}
                      </button>

                      <Link
                        to="/cart"
                        style={{
                          minWidth: 180,
                          height: 48,
                          borderRadius: 10,
                          border: "none",
                          background: "#ee4d2d",
                          color: "#fff",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textDecoration: "none",
                        }}
                      >
                        <i className="bi bi-bag-check me-2"></i>
                        {t.viewCart || "Xem giỏ hàng"}
                      </Link>
                    </div>

                    <div
                      style={{
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: "1px solid #f1f5f9",
                        display: "grid",
                        gap: 8,
                        color: "#4b5563",
                        lineHeight: 1.8,
                        fontSize: 14,
                      }}
                    >
                      <div>
                        <strong style={{ color: "#111827" }}>
                          {t.numberOfVariants || "Số biến thể:"}
                        </strong>{" "}
                        {p.variants?.length || 0}
                      </div>
                      <div>
                        <strong style={{ color: "#111827" }}>
                          {t.numberOfImages || "Số ảnh:"}
                        </strong>{" "}
                        {imageList.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-lg-7">
                  <div style={{ ...pageCard, padding: 24 }}>
                    <h3
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 20,
                        fontSize: 24,
                      }}
                    >
                      {t.productReviews || "Đánh giá sản phẩm"}
                    </h3>

                    {reviewErr && (
                      <div
                        className="alert mb-3"
                        role="alert"
                        style={{
                          background: "#fff7ed",
                          color: "#9a3412",
                          border: "1px solid #fed7aa",
                          borderRadius: 12,
                        }}
                      >
                        {reviewErr}
                      </div>
                    )}

                    {(translatedReviews || []).length === 0 ? (
                      <div
                        style={{
                          background: "#fafafa",
                          borderRadius: 14,
                          padding: 20,
                          color: "#6b7280",
                        }}
                      >
                        {t.noReviews || "Chưa có đánh giá nào cho sản phẩm này."}
                      </div>
                    ) : (
                      <div className="d-grid gap-3">
                        {(translatedReviews || []).map((r) => (
                          <div
                            key={r.id}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 16,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 800,
                                  color: "#111827",
                                }}
                              >
                                <span style={{ color: "#f59e0b" }}>
                                  {"★".repeat(Number(r.rating || 0))}
                                </span>{" "}
                                {r.translatedTitle || normalizeDisplayText(r.title)}
                              </div>
                            </div>

                            <div style={{ color: "#4b5563", lineHeight: 1.7 }}>
                              {r.translatedContent || normalizeDisplayText(r.content)}
                            </div>

                            {r.replyContent && (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: 12,
                                  background: "#fff7ed",
                                  borderRadius: 12,
                                  color: "#9a3412",
                                  border: "1px solid #fed7aa",
                                }}
                              >
                                <strong>
                                  {t.shopReply || "Phản hồi từ shop:"}
                                </strong>{" "}
                                {r.translatedReplyContent ||
                                  normalizeDisplayText(r.replyContent)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-5">
                  <div style={{ ...pageCard, padding: 24 }}>
                    <h3
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        marginBottom: 20,
                        fontSize: 24,
                      }}
                    >
                      {t.writeReview || "Viết đánh giá"}
                    </h3>

                    {!token ? (
                      <div
                        style={{
                          background: "#fafafa",
                          borderRadius: 14,
                          padding: 16,
                          color: "#4b5563",
                          lineHeight: 1.7,
                        }}
                      >
                        {t.loginRequiredPrefix || "Bạn cần "}
                        <Link
                          to="/login"
                          style={{
                            fontWeight: 700,
                            color: "#ee4d2d",
                            textDecoration: "none",
                          }}
                        >
                          {t.login || "đăng nhập"}
                        </Link>
                        {t.loginRequiredSuffix || " để gửi đánh giá."}
                      </div>
                    ) : (
                      <div className="d-grid gap-3">
                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 700 }}
                          >
                            {t.rating || "Số sao"}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            className="form-control"
                            value={rv.rating}
                            onChange={(e) =>
                              setRv({ ...rv, rating: Number(e.target.value) })
                            }
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 700 }}
                          >
                            {t.title || "Tiêu đề"}
                          </label>
                          <input
                            className="form-control"
                            placeholder={t.reviewTitlePlaceholder || "Nhập tiêu đề đánh giá"}
                            value={rv.title}
                            onChange={(e) =>
                              setRv({ ...rv, title: e.target.value })
                            }
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 700 }}
                          >
                            {t.content || "Nội dung"}
                          </label>
                          <textarea
                            className="form-control"
                            rows={5}
                            placeholder={
                              t.reviewContentPlaceholder ||
                              "Chia sẻ cảm nhận của bạn về sản phẩm"
                            }
                            value={rv.content}
                            onChange={(e) =>
                              setRv({ ...rv, content: e.target.value })
                            }
                            style={{
                              borderRadius: 10,
                              color: "#111827",
                              border: "1px solid #e5e7eb",
                              boxShadow: "none",
                            }}
                          />
                        </div>

                        <button
                          onClick={submitReview}
                          disabled={submittingReview}
                          style={{
                            height: 48,
                            borderRadius: 10,
                            border: "none",
                            background: "#ee4d2d",
                            color: "#fff",
                            fontWeight: 800,
                          }}
                        >
                          {submittingReview
                            ? (t.submitting || "Đang gửi...")
                            : (t.submitReview || "Gửi đánh giá")}
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