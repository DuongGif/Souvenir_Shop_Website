import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";

import HomePage from "../src/pages/HomePage";
import LoginPage from "../src/pages/LoginPage";
import AccountPage from "../src/pages/AccountPage";
import ContactPage from "../src/pages/ContactPage";
import Wishlist from "../src/pages/Wishlist";
import ProductsPage from "../src/pages/ProductsPage";
import DetailProductPage from "../src/pages/DetailProductPage";
import CartPage from "../src/pages/CartPage";
import OrdersPage from "../src/pages/OrdersPage";
import OrderDetailPage from "../src/pages/OrderDetailPage";
import PaymentPage from "../src/pages/PaymentPage";
import PaymentSuccess from "../src/pages/PaymentSuccess";
import PaymentCancel from "../src/pages/PaymentCancel";

import AdminPage from "../src/pages/AdminPage";
import AdminDashboard from "../src/pages/admin/AdminDashboard";
import AdminUsersPage from "../src/pages/admin/AdminUsersPage";
import AdminProductsPage from "../src/pages/admin/AdminProductsPage";
import AdminOrdersPage from "../src/pages/admin/AdminOrdersPage";
import AdminCouponsPage from "../src/pages/admin/AdminCouponsPage";
import AdminReviewsPage from "../src/pages/admin/AdminReviewsPage";

import { getRoleFromToken } from "../src/utils";

function Protected({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const token = localStorage.getItem("token");
  const role = getRoleFromToken();
  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const token = localStorage.getItem("token");
  const role = getRoleFromToken();

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div>
      <div style={{ borderBottom: "1px solid #ddd", padding: 12 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/products" style={{ marginRight: 12 }}>Products</Link>
        <Link to="/contact" style={{ marginRight: 12 }}>Contact</Link>

        {token && <Link to="/cart" style={{ marginRight: 12 }}>Cart</Link>}
        {token && <Link to="/orders" style={{ marginRight: 12 }}>Orders</Link>}
        {role === "admin" && <Link to="/admin" style={{ marginRight: 12 }}>Admin</Link>}

        <span style={{ marginLeft: 12 }}>
          {!token ? (
            <>
              <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
              <Link to="/account">Register</Link>
            </>
          ) : (
            <button onClick={logout}>Logout</button>
          )}
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<DetailProductPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* User protected */}
          <Route path="/cart" element={<Protected><CartPage /></Protected>} />
          <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
          <Route path="/orders/:orderCode" element={<Protected><OrderDetailPage /></Protected>} />
          <Route path="/payment/:orderCode" element={<Protected><PaymentPage /></Protected>} />
          <Route path="/payment-success" element={<Protected><PaymentSuccess /></Protected>} />
          <Route path="/payment-cancel" element={<Protected><PaymentCancel /></Protected>} />

          {/* Admin */}
          <Route
            path="/admin"
            element={<AdminOnly><AdminPage /></AdminOnly>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}