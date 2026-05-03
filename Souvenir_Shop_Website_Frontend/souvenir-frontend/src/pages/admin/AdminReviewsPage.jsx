import { useCallback, useEffect, useMemo, useState } from "react";
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
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
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

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productKeyword]);

  const filteredReviews = useMemo(() => {
    const keyword = productKeyword.trim().toLowerCase();

    if (!keyword) return list;

    return list.filter((review) => {
      return String(review.productId ?? "").toLowerCase().includes(keyword);
    });
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

      setMsg(`Đã phản hồi đánh giá #${selectedReview.id}`);

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="admin-reviews-page">
      <div className="admin-reviews-header">
        <div>
          <h2 className="admin-reviews-title">Quản lý đánh giá</h2>

          <p className="admin-reviews-desc">
            Xem danh sách đánh giá, tìm theo mã sản phẩm và phản hồi trực tiếp
            cho người dùng.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="btn btn-outline-primary admin-reviews-reload-btn"
        >
          Tải lại
        </button>
      </div>

      <div className="admin-reviews-filter-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-6 col-lg-5">
            <label className="form-label admin-reviews-label">
              Tìm theo mã sản phẩm
            </label>

            <input
              className="form-control admin-reviews-input"
              placeholder="Nhập mã sản phẩm..."
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
            />
          </div>

          <div className="col-md-6 col-lg-7">
            <div className="admin-reviews-stats">
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
        <div className="admin-reviews-loading">
          <div className="spinner-border text-info" role="status"></div>

          <p className="admin-reviews-loading-text">
            Đang tải danh sách đánh giá...
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-reviews-empty">
          Không tìm thấy đánh giá nào phù hợp.
        </div>
      ) : (
        <>
          <div className="admin-reviews-list">
            {pagedReviews.map((review) => (
              <div
                key={review.id}
                className="admin-reviews-card"
                onClick={() => openReplyModal(review)}
              >
                <div className="admin-reviews-card-head">
                  <div>
                    <h5 className="admin-reviews-card-title">
                      Đánh giá #{review.id}
                    </h5>

                    <div className="admin-reviews-meta">
                      <div>
                        <strong>Mã sản phẩm:</strong> {review.productId}
                      </div>

                      <div>
                        <strong>Mã người dùng:</strong> {review.userId}
                      </div>

                      <div>
                        <strong>Số sao:</strong> {review.rating}
                        <span className="admin-reviews-stars">
                          {renderStars(review.rating)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span
                      className={`admin-reviews-reply-badge ${
                        review.replyContent ? "replied" : "not-replied"
                      }`}
                    >
                      {review.replyContent ? "Đã phản hồi" : "Chưa phản hồi"}
                    </span>
                  </div>
                </div>

                <div className="admin-reviews-content-box">
                  <div className="admin-reviews-content-title">
                    {review.title || "Không có tiêu đề"}
                  </div>

                  <div className="admin-reviews-content-text">
                    {review.content || "Không có nội dung"}
                  </div>
                </div>

                {review.replyContent && (
                  <div className="admin-reviews-current-reply">
                    <div className="admin-reviews-current-reply-title">
                      Phản hồi hiện tại
                    </div>

                    <div className="admin-reviews-current-reply-text">
                      {review.replyContent}
                    </div>
                  </div>
                )}

                <div className="admin-reviews-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary admin-reviews-reply-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openReplyModal(review);
                    }}
                  >
                    {review.replyContent ? "Sửa phản hồi" : "Phản hồi"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-reviews-pagination-wrap">
            <div className="admin-reviews-limit-text">
              Hiển thị tối đa {PAGE_SIZE} đánh giá mỗi trang
            </div>

            <div className="admin-reviews-pagination">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm admin-reviews-page-btn"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
              >
                Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`btn btn-sm admin-reviews-page-btn ${
                      safeCurrentPage === page
                        ? "active"
                        : "btn-outline-primary"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm admin-reviews-page-btn"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}

      {selectedReview && (
        <div className="admin-reviews-modal-overlay" onClick={closeReplyModal}>
          <div
            className="admin-reviews-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-reviews-modal-head">
              <div>
                <h4 className="admin-reviews-modal-title">
                  Phản hồi đánh giá #{selectedReview.id}
                </h4>

                <p className="admin-reviews-modal-subtitle">
                  Người dùng #{selectedReview.userId} · Sản phẩm #
                  {selectedReview.productId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReplyModal}
                className="btn btn-light admin-reviews-modal-close"
              >
                Đóng
              </button>
            </div>

            <div className="admin-reviews-modal-body">
              <div className="admin-reviews-modal-review-box">
                <div className="admin-reviews-modal-review-title">
                  {selectedReview.title || "Không có tiêu đề"}
                </div>

                <div className="admin-reviews-modal-review-content">
                  {selectedReview.content || "Không có nội dung"}
                </div>

                <div className="admin-reviews-modal-stars">
                  {renderStars(selectedReview.rating)} ({selectedReview.rating}
                  /5)
                </div>
              </div>

              <div>
                <label className="form-label admin-reviews-label">
                  Nội dung phản hồi
                </label>

                <textarea
                  className="form-control admin-reviews-textarea"
                  rows={6}
                  placeholder="Nhập nội dung phản hồi cho người dùng..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
              </div>

              <div className="admin-reviews-modal-actions">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="btn btn-outline-secondary admin-reviews-modal-btn"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={submitReply}
                  disabled={sendingReply}
                  className="btn btn-primary admin-reviews-modal-btn"
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