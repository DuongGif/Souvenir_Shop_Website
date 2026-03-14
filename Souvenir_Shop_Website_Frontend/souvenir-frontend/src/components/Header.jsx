import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Header() {
  const nav = useNavigate();
  const { token, role, logout } = useContext(AuthContext);

  const onLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div style={{ borderBottom: "1px solid #ddd", padding: 12 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700 }}>Souvenir Shop</Link>

        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        {token && <Link to="/cart">Cart</Link>}
        {token && <Link to="/orders">Orders</Link>}
        <Link to="/contact">Contact</Link>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {role === "admin" && <Link to="/admin">Admin</Link>}
          {!token ? (
            <>
              <Link to="/login">Login</Link>
            </>
          ) : (
            <>
              <Link to="/account">Account</Link>
              <button onClick={onLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}