import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authService } from "../services/authService";

export const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (c) =>
            "%" +
            ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        )
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
    payload?.[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] ||
    ""
  );
}

export default function AuthProvider({
  children,
}) {
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [role, setRole] = useState(
    localStorage.getItem("role") || ""
  );

  // sync token + role
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);

      const extractedRole =
        getRoleFromToken(token);

      setRole(extractedRole);

      localStorage.setItem(
        "role",
        extractedRole
      );
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setRole("");
    }
  }, [token]);

  // LOGIN
  const login = async (email, password) => {
    const res = await authService.login(
      email,
      password
    );

    const data = res.data;

    // lưu token
    localStorage.setItem(
      "token",
      data.token
    );

    // lấy role từ token hoặc response
    const userRole =
      data.role ||
      getRoleFromToken(data.token) ||
      "customer";

    localStorage.setItem(
      "role",
      userRole
    );

    // update state
    setToken(data.token);
    setRole(userRole);

    return data;
  };

  // REGISTER
  const register = async (data) => {
    const res = await authService.register(
      data
    );

    return res.data;
  };

  // LOGOUT
  const logout = () => {
    setToken("");
    setRole("");

    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  const value = useMemo(
    () => ({
      token,
      role,
      login,
      register,
      logout,
      isAdmin: role === "admin",
      isLoggedIn: !!token,
    }),
    [token, role]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}