import { Link } from "react-router-dom";
import { parseProductChatMessage } from "./chatProductMessage";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { commonTranslations } from "../../i18n/common";

const API_ORIGIN = "https://localhost:7020";

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "0 ₫";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
};

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

export default function ChatMessageContent({ content, isMine = false }) {
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const parsed = parseProductChatMessage(content);

  if (!parsed) {
    return <div className="chat-message-text">{content}</div>;
  }

  const product = parsed.product || {};
  const mineClass = isMine ? "mine" : "other";

  const productUrl = product.url || `/products/${product.productId || ""}`;
  const productName = product.name || t.chatProductDefaultName || "Sản phẩm";
  const productImage = getImageSrc(product.imageUrl || "");

  return (
    <div className="chat-product-wrapper">
      <div className={`chat-product-title-small ${mineClass}`}>
        {t.chatProductSent || "Đã gửi sản phẩm để tư vấn"}
      </div>

      <Link to={productUrl} className="chat-product-link">
        <div className={`chat-product-card ${mineClass}`}>
          <div className="chat-product-layout">
            <div className={`chat-product-image-box ${mineClass}`}>
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="chat-product-image"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className={`chat-product-image-empty ${mineClass}`}>
                  <i className="bi bi-image"></i>
                </div>
              )}
            </div>

            <div className="chat-product-info">
              <div className="chat-product-name">{productName}</div>

              {!!product.variantName && (
                <div className={`chat-product-variant ${mineClass}`}>
                  {t.variantType || "Phân loại:"} {product.variantName}
                </div>
              )}

              <div className={`chat-product-price ${mineClass}`}>
                {formatPrice(product.price)}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}