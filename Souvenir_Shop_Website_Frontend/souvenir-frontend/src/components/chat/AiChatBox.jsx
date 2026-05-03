import { useState } from "react";
import { Link } from "react-router-dom";
import { aiService } from "../../services/aiService";

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

export default function AiChatBox() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text:
        "Xin chào! Mình là trợ lý AI tư vấn mua hàng của SouVN. Bạn muốn mua quà cho ai và ngân sách khoảng bao nhiêu?",
      products: [],
    },
  ]);

  const sendAiMessage = async () => {
    const message = text.trim();
    if (!message || sending) return;

    setErr("");
    setText("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
        products: [],
      },
    ]);

    try {
      setSending(true);

      const res = await aiService.chatRecommend(message, 5);
      const data = res.data || {};

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            data.reply ||
            "Mình đã tìm được một số sản phẩm phù hợp cho bạn.",
          products: data.products || [],
        },
      ]);
    } catch (ex) {
      const data = ex?.response?.data;

      let messageError = "AI tư vấn đang tạm thời không phản hồi. Bạn thử lại sau nhé.";

      if (typeof data === "string" && data.trim()) {
        messageError = data;
      } else if (data?.message) {
        messageError = data.message;
      } else if (data?.title) {
        messageError = data.title;
      }

      setErr(messageError);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: messageError,
          products: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-list">
        {messages.map((message, index) => {
          const isMine = message.role === "user";
          const mineClass = isMine ? "mine" : "other";

          return (
            <div key={index} className={`ai-chat-row ${mineClass}`}>
              <div className={`ai-chat-bubble ${mineClass}`}>
                {!isMine && (
                  <div className="ai-chat-label">
                    <i className="bi bi-stars"></i>
                    AI tư vấn
                  </div>
                )}

                <div className="ai-chat-text">{message.text}</div>

                {message.products?.length > 0 && (
                  <div className="ai-recommend-list">
                    {message.products.map((product) => {
                      const productUrl = `/products/${product.id}`;
                      const imageUrl = getImageSrc(product.imageUrl);

                      return (
                        <Link
                          key={product.id}
                          to={productUrl}
                          className="ai-recommend-card"
                        >
                          <div className="ai-recommend-image-box">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="ai-recommend-image"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="ai-recommend-empty-image">
                                <i className="bi bi-image"></i>
                              </div>
                            )}
                          </div>

                          <div className="ai-recommend-info">
                            <div className="ai-recommend-name">
                              {product.name || "Sản phẩm"}
                            </div>

                            {product.categoryName && (
                              <div className="ai-recommend-category">
                                {product.categoryName}
                              </div>
                            )}

                            <div className="ai-recommend-price">
                              {formatPrice(product.price)}
                            </div>

                            {product.reason && (
                              <div className="ai-recommend-reason">
                                {product.reason}
                              </div>
                            )}

                            <div className="ai-recommend-action">
                              Xem sản phẩm
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="ai-chat-row other">
            <div className="ai-chat-bubble other">
              <div className="ai-chat-label">
                <i className="bi bi-stars"></i>
                AI tư vấn
              </div>

              <div className="ai-chat-typing">
                Đang tìm sản phẩm phù hợp cho bạn...
              </div>
            </div>
          </div>
        )}
      </div>

      {err && <div className="ai-chat-error">{err}</div>}

      <div className="ai-chat-footer">
        <textarea
          className="form-control ai-chat-textarea"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ví dụ: Tôi muốn mua quà cho mẹ dưới 300k..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendAiMessage();
            }
          }}
        />

        <button
          type="button"
          onClick={sendAiMessage}
          disabled={sending || !text.trim()}
          className="btn ai-chat-send-button"
        >
          {sending ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}