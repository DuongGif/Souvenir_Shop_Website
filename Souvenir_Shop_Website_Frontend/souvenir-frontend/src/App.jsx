import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// User pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import Wishlist from "./pages/Wishlist";
import ProductsPage from "./pages/ProductsPage";
import DetailProductPage from "./pages/DetailProductPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

// Admin
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";

import { getRoleFromToken } from "./utils";

// Guard: user
function Protected({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Guard: admin
function AdminOnly({ children }) {
  const token = localStorage.getItem("token");
  const role = getRoleFromToken();

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
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
      <Route
        path="/cart"
        element={
          <Protected>
            <CartPage />
          </Protected>
        }
      />
      <Route
        path="/orders"
        element={
          <Protected>
            <OrdersPage />
          </Protected>
        }
      />
      <Route
        path="/orders/:orderCode"
        element={
          <Protected>
            <OrderDetailPage />
          </Protected>
        }
      />
      <Route
        path="/payment/:orderCode"
        element={
          <Protected>
            <PaymentPage />
          </Protected>
        }
      />
      <Route
        path="/payment-success"
        element={
          <Protected>
            <PaymentSuccess />
          </Protected>
        }
      />
      <Route
        path="/payment-cancel"
        element={
          <Protected>
            <PaymentCancel />
          </Protected>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminPage />
          </AdminOnly>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}