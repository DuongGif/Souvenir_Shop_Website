import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <h2>Home</h2>
      <p>Đồ án Souvenir Shop: React frontend + .NET API backend.</p>
      <Link to="/products">Go to products</Link>
    </div>
  );
}