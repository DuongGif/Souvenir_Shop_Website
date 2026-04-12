import React, { useEffect, useState } from "react";
import { adminReviewsService } from "../../services/admin/adminReviewsService";

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

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "pending") {
    return { text: "Chờ duyệt", bg: "#fef3c7", color: "#92400e" };
  }
  if (s === "approved") {
    return { text: "Đã duyệt", bg: "#dcfce7", color: "#166534" };
  }
  if (s === "rejected") {
    return { text: "Từ chối", bg: "#fee2e2", color: "#991b1b" };
  }

  return {
    text: status || "Không xác định",
    bg: "#e5e7eb",
    color: "#374151",
  };
};

export default function AdminReviewsPage() {
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminReviewsService.getAll(status);
      setList(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách đánh giá"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const approve = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminReviewsService.approve(id);
      setMsg("Đã duyệt đánh giá #" + id);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Duyệt đánh giá thất bại"));
    }
  };

  const reject = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminReviewsService.reject(id);
      setMsg("Đã từ chối đánh giá #" + id);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Từ chối đánh giá thất bại"));
    }
  };

  const reply = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminReviewsService.reply(id, { content: replyText[id] || "" });
      setMsg("Đã phản hồi đánh giá #" + id);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Phản hồi đánh giá thất bại"));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2
            style={{
              marginBottom: 6,
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            Quản lý đánh giá
          </h2>
          <p style={{ marginBottom: 0, color: "#64748b" }}>
            Duyệt, từ chối và phản hồi các đánh giá sản phẩm từ người dùng.
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <span style={{ color: "#334155", fontWeight: 600 }}>Trạng thái:</span>

          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: 180,
              height: 42,
              borderRadius: 12,
              color: "#111827",
            }}
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>

          <button
            onClick={load}
            className="btn btn-outline-primary"
            style={{ borderRadius: 12, height: 42 }}
          >
            Tải lại
          </button>
        </div>
      </div>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      {msg && (
        <div className="alert alert-success" role="alert">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3 mb-0">Đang tải danh sách đánh giá...</p>
        </div>
      ) : list.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            color: "#475569",
          }}
        >
          Không có đánh giá nào ở trạng thái này.
        </div>
      ) : (
        <div className="d-grid gap-3">
          {list.map((r) => {
            const badge = getStatusBadge(r.status);

            return (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 22,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                }}
              >
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                  <div>
                    <h5
                      style={{
                        marginBottom: 8,
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      Đánh giá #{r.id}
                    </h5>

                    <div style={{ color: "#475569", lineHeight: 1.8 }}>
                      <div>
                        <strong>Mã sản phẩm:</strong> {r.productId}
                      </div>
                      <div>
                        <strong>Mã người dùng:</strong> {r.userId}
                      </div>
                      <div>
                        <strong>Số sao:</strong> {r.rating}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {badge.text}
                  </span>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {r.title || "Không có tiêu đề"}
                  </div>

                  <div style={{ color: "#475569", lineHeight: 1.7 }}>
                    {r.content || "Không có nội dung"}
                  </div>
                </div>

                {r.replyContent && (
                  <div
                    style={{
                      background: "#eef6ff",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <div
                      style={{
                        color: "#1d4ed8",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      Phản hồi hiện tại
                    </div>
                    <div style={{ color: "#334155", lineHeight: 1.7 }}>
                      {r.replyContent}
                    </div>
                  </div>
                )}

               
                <div>
                  <label
                    className="form-label"
                    style={{ color: "#111827", fontWeight: 600 }}
                  >
                    Phản hồi đánh giá
                  </label>

                  <textarea
                    className="form-control"
                    placeholder="Nhập nội dung phản hồi..."
                    value={replyText[r.id] || ""}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [r.id]: e.target.value })
                    }
                    rows={4}
                    style={{
                      borderRadius: 12,
                      color: "#111827",
                      marginBottom: 12,
                    }}
                  />

                  <button
                    onClick={() => reply(r.id)}
                    className="btn btn-primary"
                    style={{ borderRadius: 12, fontWeight: 600 }}
                  >
                    Gửi phản hồi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}