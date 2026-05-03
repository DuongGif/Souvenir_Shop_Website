import { useCallback, useEffect, useMemo, useState } from "react";
import { adminUsersService } from "../../services/admin/adminUsersService";

const PAGE_SIZE = 5;

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
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return {
      text: "Đang hoạt động",
      className: "active",
    };
  }

  if (value === "blocked" || value === "locked") {
    return {
      text: "Đã khóa",
      className: "blocked",
    };
  }

  return {
    text: "Không xác định",
    className: "unknown",
  };
};

const getRoleBadge = (role) => {
  const value = String(role || "").toLowerCase();

  if (value === "admin") {
    return {
      text: "Quản trị viên",
      className: "admin",
    };
  }

  if (value === "customer") {
    return {
      text: "Khách hàng",
      className: "customer",
    };
  }

  return {
    text: role || "Không xác định",
    className: "unknown",
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await adminUsersService.getAll();
      const data = res.data || [];

      setUsers(data);

      const nextTotalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

      setCurrentPage((prev) => {
        return prev > nextTotalPages ? nextTotalPages : prev;
      });
    } catch (ex) {
      setErr(getErrorMessage(ex, "Không thể tải danh sách người dùng"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lock = async (id) => {
    setErr("");
    setMsg("");

    try {
      await adminUsersService.lock(id);

      setMsg(`Đã khóa người dùng #${id}`);

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

      setMsg(`Đã mở khóa người dùng #${id}`);

      await load();
    } catch (ex) {
      setErr(getErrorMessage(ex, "Mở khóa người dùng thất bại"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, safeCurrentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h2 className="admin-users-title">Quản lý người dùng</h2>

          <p className="admin-users-desc">
            Xem danh sách tài khoản và thực hiện khóa / mở khóa người dùng.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="btn btn-outline-primary admin-users-reload-btn"
        >
          Tải lại
        </button>
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
        <div className="admin-users-loading">
          <div className="spinner-border text-info" role="status"></div>

          <p className="admin-users-loading-text">
            Đang tải danh sách người dùng...
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-users-empty">Không có người dùng nào.</div>
      ) : (
        <>
          <div className="admin-users-table-card">
            <div className="table-responsive">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedUsers.map((user) => {
                    const statusBadge = getStatusBadge(user.status);
                    const roleBadge = getRoleBadge(user.role);

                    return (
                      <tr key={user.id}>
                        <td>{user.id}</td>

                        <td className="admin-users-email">{user.email}</td>

                        <td>
                          <span
                            className={`admin-users-role ${roleBadge.className}`}
                          >
                            {roleBadge.text}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-users-status ${statusBadge.className}`}
                          >
                            {statusBadge.text}
                          </span>
                        </td>

                        <td>
                          <div className="admin-users-action-list">
                            <button
                              type="button"
                              onClick={() => lock(user.id)}
                              className="btn btn-outline-danger btn-sm admin-users-action-btn"
                            >
                              Khóa
                            </button>

                            <button
                              type="button"
                              onClick={() => unlock(user.id)}
                              className="btn btn-outline-success btn-sm admin-users-action-btn"
                            >
                              Mở khóa
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

          <div className="admin-users-pagination-wrap">
            <div className="admin-users-limit-text">
              Trang {safeCurrentPage} / {totalPages} — Hiển thị tối đa{" "}
              {PAGE_SIZE} tài khoản mỗi trang
            </div>

            <div className="admin-users-pagination">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm admin-users-page-btn"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
              >
                Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`btn btn-sm admin-users-page-btn ${
                      safeCurrentPage === page
                        ? "active"
                        : "btn-outline-primary"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm admin-users-page-btn"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}