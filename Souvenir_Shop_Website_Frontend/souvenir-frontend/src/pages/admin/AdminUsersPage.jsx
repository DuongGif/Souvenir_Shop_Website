import React, { useEffect, useState } from "react";
import { adminUsersService } from "../../services/admin/adminUsersService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await adminUsersService.getAll();
    setUsers(res.data || []);
  };

  useEffect(() => { load().catch(ex => setErr(ex?.response?.data ?? "Load failed")); }, []);

  const lock = async (id) => {
    setErr(""); setMsg("");
    try {
      await adminUsersService.lock(id);
      setMsg("Locked user " + id);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Lock failed"); }
  };

  const unlock = async (id) => {
    setErr(""); setMsg("");
    try {
      await adminUsersService.unlock(id);
      setMsg("Unlocked user " + id);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Unlock failed"); }
  };

  return (
    <div>
      <h2>Admin Users</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      <table width="100%" border="1" cellPadding="8" style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th>Id</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                <button onClick={()=>lock(u.id)} style={{ marginRight: 6 }}>Lock</button>
                <button onClick={()=>unlock(u.id)}>Unlock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}