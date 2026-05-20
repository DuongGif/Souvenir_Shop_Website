import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";
import { aiService } from "../services/aiService";

const API_ORIGIN = "https://localhost:7020";

const getImageSrc = (url) => {
  if (!url) return "https://via.placeholder.com/600x400?text=Souvenir+Shop";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return "Liên hệ";
  return `${Number(price).toLocaleString("vi-VN")} ₫`;
};

const renderStars = (rating = 0) => {
  const safeRating = Math.round(Number(rating) || 0);

  return Array.from({ length: 5 }, (_, index) => (
    <i
      key={index}
      className={`bi ${
        index < safeRating ? "bi-star-fill" : "bi-star"
      } product-card-star`}
    ></i>
  ));
};

const getProductTitle = (p) => {
  const raw = p?.name || p?.slug || "Sản phẩm lưu niệm";

  return String(raw)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export default function ProductCard({ p }) {
  const { language, currentLanguageName, isVietnamese } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const originalTitle = getProductTitle(p);
  const [translatedTitle, setTranslatedTitle] = useState(originalTitle);

  useEffect(() => {
    let cancelled = false;

    const translateTitle = async () => {
      if (!originalTitle) {
        if (!cancelled) setTranslatedTitle("");
        return;
      }

      if (isVietnamese) {
        if (!cancelled) setTranslatedTitle(originalTitle);
        return;
      }

      try {
        const res = await aiService.translate(
          originalTitle,
          currentLanguageName
        );

        const nextTitle = res?.data?.translatedText?.trim() || originalTitle;

        if (!cancelled) {
          setTranslatedTitle(nextTitle);
        }
      } catch {
        if (!cancelled) {
          setTranslatedTitle(originalTitle);
        }
      }
    };

    translateTitle();

    return () => {
      cancelled = true;
    };
  }, [originalTitle, language, currentLanguageName, isVietnamese]);

  const title = translatedTitle || originalTitle;
  const imageUrl = getImageSrc(p?.imageUrl);

  const price = p?.price;
  const rating = p?.avgRating ?? 0;
  const reviewCount = p?.reviewCount ?? 0;
  const inStock = p?.inStock ?? true;

  return (
    <div className="product-card-link-wrap">
      <div className="product-card">
        <div className="product-card-image-wrap">
          <img
            src={imageUrl}
            alt={title}
            className="product-card-image"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/600x400?text=No+Image";
            }}
          />

          <span
            className={`product-card-stock-badge ${
              inStock ? "in-stock" : "out-of-stock"
            }`}
          >
            {inStock
              ? t.inStockLabel || "Còn hàng"
              : t.outOfStockLabel || "Hết hàng"}
          </span>
        </div>

        <div className="product-card-body">
          <h5 className="product-card-title">{title}</h5>

          <div className="product-card-rating-row">
            <div className="product-card-stars">{renderStars(rating)}</div>

            <small className="product-card-review-text">
              {rating > 0
                ? `${Number(rating).toFixed(1)} ★ · ${reviewCount} đánh giá`
                : t.noReviewsShort || "Chưa có đánh giá"}
            </small>
          </div>

          <div className="product-card-price">{formatPrice(price)}</div>

          <div className="d-grid">
            <Link to={`/products/${p.id}`} className="product-card-detail-button">
              {t.viewDetails || "Xem chi tiết"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}