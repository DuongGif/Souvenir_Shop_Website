import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatService } from "../../services/chatService";
import ChatMessageContent from "./ChatMessageContent";
import { buildProductChatMessage } from "./chatProductMessage";

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (ex?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (ex?.response?.status === 403) {
    return "Bạn không có quyền sử dụng chức năng chat.";
  }

  if (ex?.response?.status === 404) {
    return "Không tìm thấy API chat.";
  }

  if (ex?.response?.status >= 500) {
    return "Máy chủ chat đang lỗi.";
  }

  if (ex?.message) return ex.message;

  return fallback;
};

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CustomerChatWidget() {
  const location = useLocation();

  const isAdminPage = useMemo(
    () => location.pathname.startsWith("/admin"),
    [location.pathname]
  );

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [err, setErr] = useState("");
  const [pendingProductMessage, setPendingProductMessage] = useState("");

  const listRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const loadMessages = async (id) => {
    try {
      const res = await chatService.getMyMessages(id);
      setMessages(res.data || []);
      scrollToBottom();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải tin nhắn"));
    }
  };

  const initConversation = async () => {
    setErr("");
    setLoading(true);
    setNeedLogin(false);

    try {
      const res = await chatService.openOrGetMyConversation();
      const data = res.data || {};
      const id = data.conversationId || data.id;

      if (!id) {
        setErr("Backend không trả về conversationId.");
        return;
      }

      setConversationId(id);
      await loadMessages(id);
    } catch (ex) {
      if (ex?.response?.status === 401) {
        setNeedLogin(true);
        setErr("Bạn cần đăng nhập để dùng chat.");
      } else {
        setErr(getErrorMessage(ex, "Không thể mở hộp chat"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (event) => {
      const product = event.detail;
      if (!product) return;

      const content = buildProductChatMessage(product);
      setPendingProductMessage(content);
      setOpen(true);
    };

    window.addEventListener("souvn:chat-share-product", handler);
    return () =>
      window.removeEventListener("souvn:chat-share-product", handler);
  }, []);

  useEffect(() => {
    if (!open || isAdminPage) return;

    if (!conversationId) {
      initConversation();
      return;
    }

    loadMessages(conversationId);

    const timer = setInterval(() => {
      loadMessages(conversationId);
    }, 4000);

    return () => clearInterval(timer);
  }, [open, conversationId, isAdminPage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const sendPendingProduct = async () => {
      if (!open || !conversationId || !pendingProductMessage) return;

      try {
        await chatService.sendMyMessage(conversationId, {
          content: pendingProductMessage,
        });

        setPendingProductMessage("");
        await loadMessages(conversationId);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể gửi sản phẩm vào chat"));
      }
    };

    sendPendingProduct();
  }, [open, conversationId, pendingProductMessage]);

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
      setErr(getErrorMessage(ex, "Gửi tin nhắn thất bại"));
    } finally {
      setSending(false);
    }
  };

  if (isAdminPage) return null;

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 72,
            width: "min(360px, calc(100vw - 20px))",
            height: "min(520px, calc(100vh - 165px))",
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            border: "1px solid #eceff3",
            overflow: "hidden",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #ee4d2d 0%, #fb6a4d 100%)",
              color: "#fff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                Chat hỗ trợ
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.95,
                  lineHeight: 1.35,
                }}
              >
                SouVN Shop đang sẵn sàng hỗ trợ bạn
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-light btn-sm"
              style={{
                borderRadius: 999,
                fontWeight: 700,
                minWidth: 72,
                height: 40,
                flexShrink: 0,
              }}
            >
              Đóng
            </button>
          </div>

          {loading ? (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ flex: 1 }}
            >
              <div className="text-center">
                <div className="spinner-border text-danger" role="status"></div>
                <div className="mt-3">Đang mở cuộc trò chuyện...</div>
              </div>
            </div>
          ) : needLogin ? (
            <div style={{ padding: 16, flex: 1 }}>
              <div
                style={{
                  background: "#fff7ed",
                  color: "#9a3412",
                  border: "1px solid #fed7aa",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                Bạn cần đăng nhập để chat với cửa hàng.
              </div>

              <Link
                to="/login"
                className="btn btn-primary"
                style={{
                  background: "#ee4d2d",
                  borderColor: "#ee4d2d",
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                Đi tới đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {err && (
                <div
                  className="alert alert-danger m-3 mb-0"
                  role="alert"
                  style={{
                    borderRadius: 14,
                    flexShrink: 0,
                  }}
                >
                  {err}
                </div>
              )}

              <div
                ref={listRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: 14,
                  background: "#f8fafc",
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#64748b",
                      paddingTop: 56,
                      lineHeight: 1.6,
                    }}
                  >
                    Hãy gửi tin nhắn đầu tiên cho cửa hàng.
                  </div>
                ) : (
                  <div className="d-grid gap-3">
                    {messages.map((m) => {
                      const isMine =
                        String(m.senderRole || "").toLowerCase() === "customer";

                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "78%",
                              padding: "12px 14px 10px",
                              borderRadius: isMine
                                ? "18px 18px 6px 18px"
                                : "18px 18px 18px 6px",
                              background: isMine ? "#ee4d2d" : "#ffffff",
                              color: isMine ? "#ffffff" : "#0f172a",
                              border: isMine
                                ? "1px solid #ee4d2d"
                                : "1px solid #e2e8f0",
                              boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {!isMine && (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#ee4d2d",
                                  marginBottom: 5,
                                }}
                              >
                                Cửa hàng
                              </div>
                            )}

                            <ChatMessageContent
                              content={m.content}
                              isMine={isMine}
                            />

                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 11,
                                opacity: isMine ? 0.9 : 0.65,
                                textAlign: "right",
                              }}
                            >
                              {formatTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 12,
                  borderTop: "1px solid #e2e8f0",
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <div className="d-flex gap-2 align-items-end">
                  <textarea
                    className="form-control"
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập nội dung cần hỗ trợ..."
                    style={{
                      borderRadius: 16,
                      resize: "none",
                      minHeight: 52,
                      maxHeight: 100,
                      paddingTop: 14,
                      paddingBottom: 12,
                    }}
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
                    disabled={sending || !text.trim()}
                    className="btn"
                    style={{
                      minWidth: 86,
                      height: 52,
                      borderRadius: 16,
                      fontWeight: 800,
                      background: "#ee4d2d",
                      color: "#fff",
                      flexShrink: 0,
                      boxShadow: "0 10px 20px rgba(238, 77, 45, 0.2)",
                    }}
                  >
                    {sending ? "Gửi..." : "Gửi"}
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
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #ee4d2d 0%, #fb6a4d 100%)",
            color: "#fff",
            boxShadow: "0 16px 32px rgba(238, 77, 45, 0.32)",
            zIndex: 100000,
            fontSize: 24,
          }}
        >
          <i className="bi bi-chat-dots-fill"></i>
        </button>
      )}
    </>
  );
}