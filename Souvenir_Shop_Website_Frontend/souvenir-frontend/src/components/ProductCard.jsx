import React, { useEffect, useState } from "react";
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
  return Number(price).toLocaleString("vi-VN") + " ₫";
};

const renderStars = (rating = 0) => {
  const safeRating = Math.round(Number(rating) || 0);

  return Array.from({ length: 5 }, (_, index) => (
    <i
      key={index}
      className={`bi ${index < safeRating ? "bi-star-fill" : "bi-star"}`}
      style={{ color: "#f5b301", marginRight: 2 }}
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

    const run = async () => {
      if (!originalTitle) {
        if (!cancelled) setTranslatedTitle("");
        return;
      }

      if (isVietnamese) {
        if (!cancelled) setTranslatedTitle(originalTitle);
        return;
      }

      try {
        const res = await aiService.translate(originalTitle, currentLanguageName);
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

    run();

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
    <div
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <div
        className="h-100"
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 18,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/600x400?text=No+Image";
            }}
          />

          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: inStock ? "#198754" : "#dc3545",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 999,
            }}
          >
            {inStock
              ? t.inStockLabel || "Còn hàng"
              : t.outOfStockLabel || "Hết hàng"}
          </span>
        </div>

        <div style={{ padding: 16 }}>
          <h5
            style={{
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 10,
              lineHeight: 1.4,
              minHeight: 50,
              color: "#1f2937",
              textTransform: "none",
              letterSpacing: 0,
              wordBreak: "break-word",
            }}
          >
            {title}
          </h5>

          <div
            className="d-flex align-items-center justify-content-between mb-2"
            style={{ minHeight: 24 }}
          >
            <div>{renderStars(rating)}</div>
            <small style={{ color: "#666" }}>
              {rating > 0
                ? `${Number(rating).toFixed(1)} (${reviewCount})`
                : t.noReviewsShort || "Chưa có đánh giá"}
            </small>
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0d6efd",
              marginBottom: 14,
            }}
          >
            {formatPrice(price)}
          </div>

          <div className="d-grid">
            <Link
              to={`/products/${p.id}`}
              className="btn btn-primary"
              style={{ borderRadius: 12 }}
            >
              {t.viewDetails || "Xem chi tiết"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}