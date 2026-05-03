import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatService } from "../../services/chatService";
import ChatMessageContent from "../../components/chat/ChatMessageContent";

const PRODUCT_PREFIX = "[[PRODUCT]]";

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  return fallback;
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const getLastMessagePreview = (content) => {
  if (!content) return "Chưa có tin nhắn";

  if (typeof content === "string" && content.startsWith(PRODUCT_PREFIX)) {
    return "Đã gửi sản phẩm để tư vấn";
  }

  return content;
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

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;

      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setErr("");

    try {
      const res = await chatService.getAdminConversations(filteredKeyword);
      const data = res.data || [];

      setConversations(data);

      setSelected((prevSelected) => {
        if (!prevSelected && data.length > 0) return data[0];

        if (prevSelected) {
          const latestSelected = data.find(
            (item) =>
              String(item.conversationId) ===
              String(prevSelected.conversationId)
          );

          return latestSelected || prevSelected;
        }

        return prevSelected;
      });
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách cuộc trò chuyện"));
    } finally {
      setLoadingList(false);
    }
  }, [filteredKeyword]);

  const loadMessages = useCallback(
    async (conversationId) => {
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
    },
    [scrollToBottom]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 300);

    return () => clearTimeout(timer);
  }, [filteredKeyword, loadConversations]);

  useEffect(() => {
    if (!selected?.conversationId) return;

    loadMessages(selected.conversationId);

    const timer = setInterval(() => {
      loadMessages(selected.conversationId);
      loadConversations();
    }, 4000);

    return () => clearInterval(timer);
  }, [selected?.conversationId, loadMessages, loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendReply = async () => {
    if (!selected?.conversationId || !reply.trim()) return;

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
    <div className="admin-chat-page">
      <div className="admin-chat-header">
        <h2 className="admin-chat-title">Chat với khách hàng</h2>

        <p className="admin-chat-desc">
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
          <div className="admin-chat-card">
            <div className="admin-chat-sidebar-head">
              <div className="admin-chat-sidebar-title">Chat</div>

              <input
                className="form-control admin-chat-search"
                placeholder="Tìm theo tên khách hàng..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="admin-chat-conversation-list">
              {loadingList ? (
                <div className="admin-chat-loading">
                  Đang tải hội thoại...
                </div>
              ) : conversations.length === 0 ? (
                <div className="admin-chat-empty">
                  Chưa có cuộc trò chuyện nào.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive =
                    String(selected?.conversationId) ===
                    String(conversation.conversationId);

                  return (
                    <button
                      key={conversation.conversationId}
                      type="button"
                      onClick={() => setSelected(conversation)}
                      className={`admin-chat-conversation-button ${
                        isActive ? "active" : ""
                      }`}
                    >
                      <div className="admin-chat-conversation-row">
                        <div className="admin-chat-conversation-main">
                          <div className="admin-chat-customer-name">
                            {conversation.customerName ||
                              `Khách hàng #${conversation.customerId}`}
                          </div>

                          <div className="admin-chat-customer-email">
                            {conversation.customerEmail || ""}
                          </div>

                          <div className="admin-chat-last-message">
                            {getLastMessagePreview(conversation.lastMessage)}
                          </div>
                        </div>

                        <div className="admin-chat-conversation-meta">
                          <div className="admin-chat-time-small">
                            {formatTime(conversation.lastMessageAt)}
                          </div>

                          {!!conversation.unreadCount && (
                            <span className="admin-chat-unread">
                              {conversation.unreadCount}
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
          <div className="admin-chat-card">
            {!selected ? (
              <div className="admin-chat-panel-empty">
                Hãy chọn một cuộc trò chuyện để bắt đầu phản hồi.
              </div>
            ) : (
              <>
                <div className="admin-chat-panel-head">
                  <div>
                    <div className="admin-chat-panel-name">
                      {selected.customerName ||
                        `Khách hàng #${selected.customerId}`}
                    </div>

                    <div className="admin-chat-panel-email">
                      {selected.customerEmail || ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadMessages(selected.conversationId)}
                    className="btn btn-outline-primary admin-chat-reload-button"
                  >
                    Tải lại
                  </button>
                </div>

                <div ref={listRef} className="admin-chat-message-list-wrap">
                  {loadingMessages ? (
                    <div className="admin-chat-message-empty">
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="admin-chat-message-empty">
                      Chưa có tin nhắn nào trong cuộc trò chuyện này.
                    </div>
                  ) : (
                    <div className="admin-chat-message-list">
                      {messages.map((message) => {
                        const isAdmin =
                          String(message.senderRole || "").toLowerCase() ===
                          "admin";

                        const roleClass = isAdmin ? "admin" : "customer";

                        return (
                          <div
                            key={message.id}
                            className={`admin-chat-message-row ${roleClass}`}
                          >
                            <div
                              className={`admin-chat-bubble ${roleClass}`}
                            >
                              <div
                                className={`admin-chat-sender ${roleClass}`}
                              >
                                {isAdmin
                                  ? "Bạn"
                                  : message.senderName || "Khách hàng"}
                              </div>

                              <ChatMessageContent
                                content={message.content}
                                isMine={isAdmin}
                              />

                              <div className="admin-chat-message-time">
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="admin-chat-reply-footer">
                  <div className="admin-chat-reply-row">
                    <textarea
                      className="form-control admin-chat-reply-input"
                      rows={3}
                      placeholder="Nhập nội dung phản hồi cho khách hàng..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
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
                      className="btn btn-primary admin-chat-send-button"
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