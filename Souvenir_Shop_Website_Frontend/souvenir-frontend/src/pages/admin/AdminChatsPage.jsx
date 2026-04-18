import React, { useEffect, useMemo, useRef, useState } from "react";
import { chatService } from "../../services/chatService";
import ChatMessageContent from "../../components/chat/ChatMessageContent";

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  return fallback;
};

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

export default function AdminChatsPage() {
  const [keyword, setKeyword] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const listRef = useRef(null);

  const filteredKeyword = useMemo(() => keyword.trim(), [keyword]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const loadConversations = async () => {
    setLoadingList(true);
    setErr("");

    try {
      const res = await chatService.getAdminConversations(filteredKeyword);
      const data = res.data || [];
      setConversations(data);

      if (!selected && data.length > 0) {
        setSelected(data[0]);
      }

      if (selected) {
        const latestSelected = data.find(
          (x) => String(x.conversationId) === String(selected.conversationId)
        );
        if (latestSelected) setSelected(latestSelected);
      }
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách cuộc trò chuyện"));
    } finally {
      setLoadingList(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    setLoadingMessages(true);

    try {
      const res = await chatService.getAdminMessages(conversationId);
      setMessages(res.data || []);
      await chatService.markAdminRead(conversationId);
      scrollToBottom();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải nội dung trò chuyện"));
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 300);

    return () => clearTimeout(timer);
  }, [filteredKeyword]);

  useEffect(() => {
    if (!selected?.conversationId) return;

    loadMessages(selected.conversationId);

    const timer = setInterval(() => {
      loadMessages(selected.conversationId);
      loadConversations();
    }, 4000);

    return () => clearInterval(timer);
  }, [selected?.conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendReply = async () => {
    if (!selected?.conversationId) return;
    if (!reply.trim()) return;

    setSending(true);
    setErr("");

    try {
      await chatService.sendAdminMessage(selected.conversationId, {
        content: reply.trim(),
      });

      setReply("");
      await loadMessages(selected.conversationId);
      await loadConversations();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Gửi phản hồi thất bại"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ marginBottom: 6, color: "#0f172a", fontWeight: 800 }}>
          Chat với khách hàng
        </h2>
        <p style={{ marginBottom: 0, color: "#64748b" }}>
          Theo dõi và phản hồi tin nhắn của khách hàng ngay trong trang quản trị.
        </p>
      </div>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-4">
          <div
            style={{
              background: "#fff",
              borderRadius: 22,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              overflow: "hidden",
              border: "1px solid #eef2f7",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#2563eb",
                  marginBottom: 12,
                }}
              >
                Chat
              </div>

              <input
                className="form-control"
                placeholder="Tìm theo tên khách hàng..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderColor: "#dbeafe",
                }}
              />
            </div>

            <div
              style={{
                height: 620,
                overflowY: "auto",
                background: "#fff",
              }}
            >
              {loadingList ? (
                <div className="text-center py-5">Đang tải hội thoại...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 18, color: "#64748b" }}>
                  Chưa có cuộc trò chuyện nào.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive =
                    String(selected?.conversationId) ===
                    String(c.conversationId);

                  return (
                    <button
                      key={c.conversationId}
                      type="button"
                      onClick={() => setSelected(c)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background: isActive ? "#eff6ff" : "#fff",
                        padding: 16,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#0f172a",
                              marginBottom: 4,
                            }}
                          >
                            {c.customerName || `Khách hàng #${c.customerId}`}
                          </div>

                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 13,
                              marginBottom: 6,
                            }}
                          >
                            {c.customerEmail || ""}
                          </div>

                          <div
                            style={{
                              color: "#475569",
                              fontSize: 14,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {c.lastMessage || "Chưa có tin nhắn"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                              marginBottom: 6,
                            }}
                          >
                            {formatTime(c.lastMessageAt)}
                          </div>

                          {!!c.unreadCount && (
                            <span
                              style={{
                                display: "inline-flex",
                                minWidth: 24,
                                height: 24,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 999,
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "0 8px",
                              }}
                            >
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div
            style={{
              background: "#fff",
              borderRadius: 22,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              overflow: "hidden",
              border: "1px solid #eef2f7",
            }}
          >
            {!selected ? (
              <div className="text-center py-5" style={{ color: "#64748b" }}>
                Hãy chọn một cuộc trò chuyện để bắt đầu phản hồi.
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: 18,
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {selected.customerName ||
                        `Khách hàng #${selected.customerId}`}
                    </div>

                    <div style={{ color: "#64748b", marginTop: 4 }}>
                      {selected.customerEmail || ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadMessages(selected.conversationId)}
                    className="btn btn-outline-primary"
                    style={{ borderRadius: 12, fontWeight: 700 }}
                  >
                    Tải lại
                  </button>
                </div>

                <div
                  ref={listRef}
                  style={{
                    height: 500,
                    overflowY: "auto",
                    padding: 16,
                    background: "#f8fafc",
                  }}
                >
                  {loadingMessages ? (
                    <div className="text-center py-5">Đang tải tin nhắn...</div>
                  ) : messages.length === 0 ? (
                    <div
                      className="text-center py-5"
                      style={{ color: "#64748b" }}
                    >
                      Chưa có tin nhắn nào trong cuộc trò chuyện này.
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {messages.map((m) => {
                        const isAdmin =
                          String(m.senderRole || "").toLowerCase() === "admin";

                        return (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: isAdmin
                                ? "flex-end"
                                : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "78%",
                                background: isAdmin ? "#2563eb" : "#fff",
                                color: isAdmin ? "#fff" : "#0f172a",
                                border: isAdmin
                                  ? "1px solid #2563eb"
                                  : "1px solid #dbeafe",
                                borderRadius: isAdmin
                                  ? "18px 18px 6px 18px"
                                  : "18px 18px 18px 6px",
                                padding: "10px 12px",
                                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  marginBottom: 6,
                                  color: isAdmin
                                    ? "rgba(255,255,255,0.92)"
                                    : "#2563eb",
                                }}
                              >
                                {isAdmin ? "Bạn" : m.senderName || "Khách hàng"}
                              </div>

                              <ChatMessageContent
                                content={m.content}
                                isMine={isAdmin}
                              />

                              <div
                                style={{
                                  marginTop: 6,
                                  fontSize: 11,
                                  opacity: 0.8,
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
                    padding: 16,
                    borderTop: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                >
                  <div className="d-flex gap-2 align-items-end">
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Nhập nội dung phản hồi cho khách hàng..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      style={{
                        borderRadius: 14,
                        resize: "none",
                        borderColor: "#dbeafe",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="btn btn-primary"
                      style={{
                        minWidth: 110,
                        borderRadius: 14,
                        fontWeight: 700,
                      }}
                    >
                      {sending ? "Đang gửi" : "Gửi"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}