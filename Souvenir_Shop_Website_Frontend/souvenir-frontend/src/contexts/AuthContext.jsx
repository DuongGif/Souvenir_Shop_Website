import React, { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRoleFromToken(token) {
  const payload = parseJwt(token);
  return (
    payload?.role ||
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    null
  );
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setRole(getRoleFromToken(token) || "");
    } else {
      localStorage.removeItem("token");
      setRole("");
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    setToken(res.data.token);
    return res.data;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res.data;
  };

  const logout = () => setToken("");

  const value = useMemo(
    () => ({ token, role, login, register, logout }),
    [token, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}