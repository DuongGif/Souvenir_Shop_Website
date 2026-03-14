import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function AdminPage() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap: 16 }}>
      <div style={{ border:"1px solid #ddd", padding: 12 }}>
        <h3>Admin</h3>
        <div style={{ display:"grid", gap: 8 }}>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/coupons">Coupons</Link>
          <Link to="/admin/reviews">Reviews</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
        </div>
      </div>

      <div style={{ border:"1px solid #ddd", padding: 12 }}>
        <Outlet />
      </div>
    </div>
  );
}