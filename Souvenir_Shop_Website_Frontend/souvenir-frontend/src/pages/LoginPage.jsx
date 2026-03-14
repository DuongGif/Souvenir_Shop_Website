import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const data = await login(email, password);
      // data.role có thể dùng nếu muốn
      nav("/products");
    } catch (ex) {
      setErr(ex?.response?.data ?? "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      {err && <div style={{ color: "red" }}>{String(err)}</div>}
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: 10 }}>
        Demo: đăng nhập admin bằng email admin@souvenir.com (role admin) để vào trang Admin.
      </p>

      <p>
        Chưa có tài khoản? <Link to="/account">Tạo tài khoản trong Account</Link>
      </p>
    </div>
  );
}