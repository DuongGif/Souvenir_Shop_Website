import React from "react";

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
      <button disabled={page <= 1} onClick={onPrev}>Prev</button>
      <span>Page {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={onNext}>Next</button>
    </div>
  );
}