import React from "react";
import { Link } from "react-router-dom";
import { parseProductChatMessage } from "./chatProductMessage";

const API_ORIGIN = "https://localhost:7020";

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
};

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

export default function ChatMessageContent({ content, isMine = false }) {
  const parsed = parseProductChatMessage(content);

  if (!parsed) {
    return (
      <div
        style={{
          lineHeight: 1.55,
          fontSize: 15,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {content}
      </div>
    );
  }

  const p = parsed.product || {};

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          opacity: isMine ? 0.92 : 1,
          marginBottom: 8,
        }}
      >
        Đã gửi sản phẩm để tư vấn
      </div>

      <Link
        to={p.url || `/products/${p.productId}`}
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            background: isMine ? "rgba(255,255,255,0.12)" : "#fff7f5",
            border: isMine
              ? "1px solid rgba(255,255,255,0.18)"
              : "1px solid #ffd7cc",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div className="d-flex gap-2 align-items-start">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: "hidden",
                background: isMine ? "rgba(255,255,255,0.12)" : "#fff",
                border: isMine
                  ? "1px solid rgba(255,255,255,0.14)"
                  : "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              {p.imageUrl ? (
                <img
                  src={getImageSrc(p.imageUrl)}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  lineHeight: 1.45,
                  marginBottom: 4,
                }}
              >
                {p.name || "Sản phẩm"}
              </div>

              {!!p.variantName && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: isMine ? 0.9 : 0.7,
                    marginBottom: 4,
                  }}
                >
                  Phân loại: {p.variantName}
                </div>
              )}

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: isMine ? "#fff" : "#ee4d2d",
                }}
              >
                {formatPrice(p.price)}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}