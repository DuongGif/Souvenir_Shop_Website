import React from "react";

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div
      style={{
        marginTop: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {/* Nút Trước */}
      <button
        disabled={page <= 1}
        onClick={onPrev}
        style={{
          minWidth: 90,
          height: 42,
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: page <= 1 ? "#f3f4f6" : "#fff",
          color: page <= 1 ? "#9ca3af" : "#374151",
          fontWeight: 700,
          cursor: page <= 1 ? "not-allowed" : "pointer",
        }}
      >
        Trước
      </button>

      {/* Số trang */}
      <span
        style={{
          color: "#111827", // 🔥 FIX CHÍNH (không còn bị mờ)
          fontWeight: 800,
          fontSize: 16,
          minWidth: 120,
          textAlign: "center",
        }}
      >
        Trang {page} / {totalPages}
      </span>

      {/* Nút Tiếp */}
      <button
        disabled={page >= totalPages}
        onClick={onNext}
        style={{
          minWidth: 90,
          height: 42,
          borderRadius: 10,
          border: "none",
          background: page >= totalPages ? "#f3f4f6" : "#ee4d2d",
          color: page >= totalPages ? "#9ca3af" : "#fff",
          fontWeight: 700,
          cursor: page >= totalPages ? "not-allowed" : "pointer",
        }}
      >
        Tiếp
      </button>
    </div>
  );
}