import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatService } from "../../services/chatService";
import ChatMessageContent from "./ChatMessageContent";
import AiChatBox from "./AiChatBox";
import { buildProductChatMessage } from "./chatProductMessage";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { commonTranslations } from "../../i18n/common";

const getErrorMessage = (ex, fallback, t) => {
  const data = ex?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (ex?.response?.status === 401) {
    return (
      t.chatSessionExpired ||
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    );
  }

  if (ex?.response?.status === 403) {
    return t.chatNoPermission || "Bạn không có quyền sử dụng chức năng chat.";
  }

  if (ex?.response?.status === 404) {
    return t.chatApiNotFound || "Không tìm thấy API chat.";
  }

  if (ex?.response?.status >= 500) {
    return t.chatServerError || "Máy chủ chat đang lỗi.";
  }

  if (ex?.message) return ex.message;

  return fallback;
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CustomerChatWidget() {
  const location = useLocation();
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

  const isAdminPage = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location.pathname]);

  const [open, setOpen] = useState(false);
  const [chatMode, setChatMode] = useState("shop");

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [err, setErr] = useState("");
  const [pendingProductMessage, setPendingProductMessage] = useState("");

  const listRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;

      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const loadMessages = useCallback(
    async (id) => {
      try {
        const res = await chatService.getMyMessages(id);

        setMessages(res.data || []);
        scrollToBottom();
      } catch (ex) {
        setErr(
          getErrorMessage(
            ex,
            t.chatLoadMessagesFailed || "Không thể tải tin nhắn",
            t
          )
        );
      }
    },
    [scrollToBottom, t]
  );

  const initConversation = useCallback(async () => {
    setErr("");
    setLoading(true);
    setNeedLogin(false);

    try {
      const res = await chatService.openOrGetMyConversation();
      const data = res.data || {};
      const id = data.conversationId || data.id;

      if (!id) {
        setErr(
          t.chatMissingConversationId ||
            "Backend không trả về conversationId."
        );
        return;
      }

      setConversationId(id);
      await loadMessages(id);
    } catch (ex) {
      if (ex?.response?.status === 401) {
        setNeedLogin(true);
        setErr(t.chatNeedLogin || "Bạn cần đăng nhập để dùng chat.");
      } else {
        setErr(
          getErrorMessage(ex, t.chatOpenFailed || "Không thể mở hộp chat", t)
        );
      }
    } finally {
      setLoading(false);
    }
  }, [loadMessages, t]);

  useEffect(() => {
    const handler = (event) => {
      const product = event.detail;
      if (!product) return;

      const content = buildProductChatMessage(product);

      setChatMode("shop");
      setPendingProductMessage(content);
      setOpen(true);
    };

    window.addEventListener("souvn:chat-share-product", handler);

    return () => {
      window.removeEventListener("souvn:chat-share-product", handler);
    };
  }, []);

  useEffect(() => {
    if (!open || isAdminPage) return;
    if (chatMode !== "shop") return;

    if (!conversationId) {
      initConversation();
      return;
    }

    loadMessages(conversationId);

    const timer = setInterval(() => {
      loadMessages(conversationId);
    }, 4000);

    return () => clearInterval(timer);
  }, [
    open,
    chatMode,
    conversationId,
    isAdminPage,
    initConversation,
    loadMessages,
  ]);

  useEffect(() => {
    if (chatMode !== "shop") return;
    scrollToBottom();
  }, [messages, chatMode, scrollToBottom]);

  useEffect(() => {
    const sendPendingProduct = async () => {
      if (!open || chatMode !== "shop" || !conversationId || !pendingProductMessage)
        return;

      try {
        await chatService.sendMyMessage(conversationId, {
          content: pendingProductMessage,
        });

        setPendingProductMessage("");
        await loadMessages(conversationId);
      } catch (ex) {
        setErr(
          getErrorMessage(
            ex,
            t.chatSendProductFailed || "Không thể gửi sản phẩm vào chat",
            t
          )
        );
      }
    };

    sendPendingProduct();
  }, [
    open,
    chatMode,
    conversationId,
    pendingProductMessage,
    loadMessages,
    t,
  ]);

  const sendMessage = async () => {
    if (!conversationId || !text.trim()) return;

    setSending(true);
    setErr("");

    try {
      await chatService.sendMyMessage(conversationId, {
        content: text.trim(),
      });

      setText("");
      await loadMessages(conversationId);
    } catch (ex) {
      setErr(
        getErrorMessage(ex, t.chatSendFailed || "Gửi tin nhắn thất bại", t)
      );
    } finally {
      setSending(false);
    }
  };

  if (isAdminPage) return null;

  return (
    <>
      {open && (
        <div className="customer-chat-widget">
          <div className="customer-chat-header">
            <div className="customer-chat-header-info">
              <div className="customer-chat-title">
                {t.chatSupportTitle || "Chat hỗ trợ"}
              </div>

              <div className="customer-chat-subtitle">
                {chatMode === "ai"
                  ? "AI gợi ý sản phẩm phù hợp với nhu cầu của bạn"
                  : t.chatSupportSubtitle ||
                    "SouVN Shop đang sẵn sàng hỗ trợ bạn"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-light btn-sm customer-chat-close-button"
            >
              {t.close || "Đóng"}
            </button>
          </div>

          <div className="customer-chat-tabs">
            <button
              type="button"
              className={chatMode === "shop" ? "active" : ""}
              onClick={() => setChatMode("shop")}
            >
              <i className="bi bi-shop"></i>
              Cửa hàng
            </button>

            <button
              type="button"
              className={chatMode === "ai" ? "active" : ""}
              onClick={() => setChatMode("ai")}
            >
              <i className="bi bi-stars"></i>
              AI tư vấn
            </button>
          </div>

          {chatMode === "ai" ? (
            <AiChatBox />
          ) : loading ? (
            <div className="customer-chat-loading">
              <div className="text-center">
                <div className="spinner-border text-danger" role="status"></div>

                <div className="customer-chat-loading-text">
                  {t.chatOpeningConversation ||
                    "Đang mở cuộc trò chuyện..."}
                </div>
              </div>
            </div>
          ) : needLogin ? (
            <div className="customer-chat-login-box">
              <div className="customer-chat-login-alert">
                {t.chatNeedLogin || "Bạn cần đăng nhập để chat với cửa hàng."}
              </div>

              <Link
                to="/login"
                className="btn btn-primary customer-chat-login-button"
              >
                {t.goToLogin || "Đi tới đăng nhập"}
              </Link>
            </div>
          ) : (
            <>
              {err && (
                <div
                  className="alert alert-danger m-3 mb-0 customer-chat-error"
                  role="alert"
                >
                  {err}
                </div>
              )}

              <div ref={listRef} className="customer-chat-list">
                {messages.length === 0 ? (
                  <div className="customer-chat-empty">
                    {t.chatEmptyMessage ||
                      "Hãy gửi tin nhắn đầu tiên cho cửa hàng."}
                  </div>
                ) : (
                  <div className="customer-chat-message-list">
                    {messages.map((message) => {
                      const isMine =
                        String(message.senderRole || "").toLowerCase() ===
                        "customer";

                      const mineClass = isMine ? "mine" : "other";

                      return (
                        <div
                          key={message.id}
                          className={`customer-chat-message-row ${mineClass}`}
                        >
                          <div className={`customer-chat-bubble ${mineClass}`}>
                            {!isMine && (
                              <div className="customer-chat-shop-label">
                                {t.shopLabel || "Cửa hàng"}
                              </div>
                            )}

                            <ChatMessageContent
                              content={message.content}
                              isMine={isMine}
                            />

                            <div className={`customer-chat-time ${mineClass}`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="customer-chat-footer">
                <div className="customer-chat-input-row">
                  <textarea
                    className="form-control customer-chat-textarea"
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      t.chatInputPlaceholder ||
                      "Nhập nội dung cần hỗ trợ..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || !text.trim() || !conversationId}
                    className="btn customer-chat-send-button"
                  >
                    {sending ? t.sending || "Gửi..." : t.send || "Gửi"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="customer-chat-floating-button"
        >
          <i className="bi bi-chat-dots-fill"></i>
        </button>
      )}
    </>
  );
}