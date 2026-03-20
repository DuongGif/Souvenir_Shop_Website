import React, { useEffect, useState } from "react";
import { adminUsersService } from "../../services/admin/adminUsersService";

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const firstError = Object.values(data.errors)?.flat?.()[0];
    if (firstError) return firstError;
  }
  return fallback;
};

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "active") {
    return { text: "Active", bg: "#dcfce7", color: "#166534" };
  }

  if (s === "blocked" || s === "locked") {
    return { text: "Blocked", bg: "#fee2e2", color: "#991b1b" };
  }

  return { text: status || "Unknown", bg: "#e5e7eb", color: "#374151" };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminUsersService.getAll();
      setUsers(res.data || []);
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách người dùng"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const lock = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminUsersService.lock(id);
      setMsg("Đã khóa người dùng #" + id);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Khóa người dùng thất bại"));
    }
  };

  const unlock = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminUsersService.unlock(id);
      setMsg("Đã mở khóa người dùng #" + id);
      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Mở khóa người dùng thất bại"));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2
            style={{
              marginBottom: 6,
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            Quản lý người dùng
          </h2>
          <p style={{ marginBottom: 0, color: "#64748b" }}>
            Xem danh sách tài khoản và thực hiện khóa / mở khóa người dùng.
          </p>
        </div>
      </div>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      {msg && (
        <div className="alert alert-success" role="alert">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3 mb-0">Đang tải danh sách người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            color: "#475569",
          }}
        >
          Không có người dùng nào.
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div className="table-responsive">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#1f2937",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      color: "#0f172a",
                      fontWeight: 700,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Id
                  </th>
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      color: "#0f172a",
                      fontWeight: 700,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      color: "#0f172a",
                      fontWeight: 700,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      color: "#0f172a",
                      fontWeight: 700,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      color: "#0f172a",
                      fontWeight: 700,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const badge = getStatusBadge(u.status);

                  return (
                    <tr key={u.id}>
                      <td
                        style={{
                          padding: "14px",
                          color: "#334155",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {u.id}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          color: "#334155",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: 500,
                        }}
                      >
                        {u.email}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          color: "#334155",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {u.role}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {badge.text}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            onClick={() => lock(u.id)}
                            className="btn btn-outline-danger btn-sm"
                            style={{ borderRadius: 10, fontWeight: 600 }}
                          >
                            Lock
                          </button>

                          <button
                            onClick={() => unlock(u.id)}
                            className="btn btn-outline-success btn-sm"
                            style={{ borderRadius: 10, fontWeight: 600 }}
                          >
                            Unlock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}