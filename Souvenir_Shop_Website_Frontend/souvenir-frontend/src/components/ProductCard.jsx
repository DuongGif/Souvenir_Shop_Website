import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  return (
    <Link to={`/products/${p.id}`} style={{ border: "1px solid #ddd", padding: 12, textDecoration: "none", color: "inherit" }}>
      <div style={{ fontWeight: 700 }}>{p.slug}</div>
      <div>Price: {p.price ?? 0}</div>
      {"avgRating" in p && <div>Rating: {p.avgRating} ({p.reviewCount})</div>}
      {"inStock" in p && <div>{p.inStock ? "In stock" : "Out of stock"}</div>}
      {p.imageUrl && <div style={{ fontSize: 12, marginTop: 6 }}>{p.imageUrl}</div>}
    </Link>
  );
}