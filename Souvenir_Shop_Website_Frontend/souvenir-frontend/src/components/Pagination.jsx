export default function Pagination({ page, totalPages, onPrev, onNext }) {
  const currentPage = Number(page || 1);
  const pages = Math.max(1, Number(totalPages || 1));

  return (
    <div className="pagination-wrap">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={onPrev}
        className="pagination-button pagination-prev"
      >
        Trước
      </button>

      <span className="pagination-info">
        Trang {currentPage} / {pages}
      </span>

      <button
        type="button"
        disabled={currentPage >= pages}
        onClick={onNext}
        className="pagination-button pagination-next"
      >
        Tiếp
      </button>
    </div>
  );
}