import React, { useEffect, useMemo, useState } from "react";
import { adminReviewsService } from "../../services/admin/adminReviewsService";

const PAGE_SIZE = 5;

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

const renderStars = (rating) => {
  const safeRating = Number(rating || 0);
  return "★".repeat(safeRating) + "☆".repeat(Math.max(0, 5 - safeRating));
};

export default function AdminReviewsPage() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [productKeyword, setProductKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminReviewsService.getAll();
      setList(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách đánh giá"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [productKeyword]);

  const filteredReviews = useMemo(() => {
    const keyword = productKeyword.trim().toLowerCase();

    if (!keyword) return list;

    return list.filter((r) =>
      String(r.productId ?? "").toLowerCase().includes(keyword)
    );
  }, [list, productKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedReviews = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, safeCurrentPage]);

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyContent(review.replyContent || "");
  };

  const closeReplyModal = () => {
    setSelectedReview(null);
    setReplyContent("");
  };

  const submitReply = async () => {
    if (!selectedReview) return;

    setErr("");
    setMsg("");

    if (!replyContent.trim()) {
      setErr("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      setSendingReply(true);
      await adminReviewsService.reply(selectedReview.id, {
        content: replyContent.trim(),
      });

      setMsg("Đã phản hồi đánh giá #" + selectedReview.id);
      closeReplyModal();
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Phản hồi đánh giá thất bại"));
    } finally {
      setSendingReply(false);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            Xem danh sách đánh giá, tìm theo mã sản phẩm và phản hồi trực tiếp cho
            người dùng.
          </p>
        </div>

        <button
          onClick={load}
          className="btn btn-outline-primary"
          style={{ borderRadius: 12, height: 42 }}
        >
          Tải lại
        </button>
      </div>

      <div
        className="mb-4"
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-6 col-lg-5">
            <label
              className="form-label"
              style={{ color: "#111827", fontWeight: 600 }}
            >
              Tìm theo mã sản phẩm
            </label>
            <input
              className="form-control"
              placeholder="Nhập mã sản phẩm..."
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
              style={{ height: 44, borderRadius: 12, color: "#111827" }}
            />
          </div>

          <div className="col-md-6 col-lg-7">
            <div
              className="d-flex flex-wrap gap-3"
              style={{ color: "#64748b", fontWeight: 500 }}
            >
              <span>Tổng đánh giá: {list.length}</span>
              <span>Kết quả tìm được: {filteredReviews.length}</span>
              <span>
                Trang {safeCurrentPage} / {totalPages}
              </span>
            </div>
          </div>
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
      ) : filteredReviews.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            color: "#475569",
          }}
        >
          Không tìm thấy đánh giá nào phù hợp.
        </div>
      ) : (
        <>
          <div className="d-grid gap-3">
            {pagedReviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 22,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => openReplyModal(r)}
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
                        <strong>Số sao:</strong> {r.rating}{" "}
                        <span style={{ color: "#f59e0b", marginLeft: 6 }}>
                          {renderStars(r.rating)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span
                      style={{
                        display: "inline-block",
                        background: r.replyContent ? "#dcfce7" : "#e0f2fe",
                        color: r.replyContent ? "#166534" : "#075985",
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {r.replyContent ? "Đã phản hồi" : "Chưa phản hồi"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 14,
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
                      border: "1px solid #dbeafe",
                      marginBottom: 14,
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

                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ borderRadius: 12, fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openReplyModal(r);
                    }}
                  >
                    {r.replyContent ? "Sửa phản hồi" : "Phản hồi"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4">
            <div style={{ color: "#64748b", fontWeight: 500 }}>
              Hiển thị tối đa {PAGE_SIZE} đánh giá mỗi trang
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`btn btn-sm ${
                      safeCurrentPage === page
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => goToPage(page)}
                    style={{
                      minWidth: 40,
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}

      {selectedReview && (
        <div
          onClick={closeReplyModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  Phản hồi đánh giá #{selectedReview.id}
                </h4>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  Người dùng #{selectedReview.userId} · Sản phẩm #
                  {selectedReview.productId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReplyModal}
                className="btn btn-light"
                style={{ borderRadius: 12, fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    color: "#0f172a",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {selectedReview.title || "Không có tiêu đề"}
                </div>

                <div
                  style={{
                    color: "#475569",
                    lineHeight: 1.7,
                    marginBottom: 10,
                  }}
                >
                  {selectedReview.content || "Không có nội dung"}
                </div>

                <div style={{ color: "#f59e0b", fontWeight: 700 }}>
                  {renderStars(selectedReview.rating)} ({selectedReview.rating}/5)
                </div>
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ color: "#111827", fontWeight: 600 }}
                >
                  Nội dung phản hồi
                </label>

                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Nhập nội dung phản hồi cho người dùng..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  style={{
                    borderRadius: 14,
                    color: "#111827",
                    marginBottom: 16,
                  }}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: 12, fontWeight: 600 }}
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={submitReply}
                  disabled={sendingReply}
                  className="btn btn-primary"
                  style={{ borderRadius: 12, fontWeight: 600 }}
                >
                  {sendingReply ? "Đang gửi..." : "Gửi phản hồi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}