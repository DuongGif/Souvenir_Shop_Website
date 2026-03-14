import React, { useEffect, useState } from "react";
import { adminReviewsService } from "../../services/admin/adminReviewsService";

export default function AdminReviewsPage() {
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await adminReviewsService.getAll(status);
    setList(res.data || []);
  };

  useEffect(() => { load().catch(ex => setErr(ex?.response?.data ?? "Load failed")); }, [status]);

  const approve = async (id) => {
    setErr(""); setMsg("");
    try {
      await adminReviewsService.approve(id);
      setMsg("Approved " + id);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Approve failed"); }
  };

  const reject = async (id) => {
    setErr(""); setMsg("");
    try {
      await adminReviewsService.reject(id);
      setMsg("Rejected " + id);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Reject failed"); }
  };

  const reply = async (id) => {
    setErr(""); setMsg("");
    try {
      await adminReviewsService.reply(id, { content: replyText[id] || "" });
      setMsg("Replied " + id);
    } catch (ex) { setErr(ex?.response?.data ?? "Reply failed"); }
  };

  return (
    <div>
      <h2>Admin Reviews</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
        <span>Status:</span>
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
        <button onClick={load}>Reload</button>
      </div>

      <div style={{ marginTop: 12 }}>
        {list.map(r => (
          <div key={r.id} style={{ border:"1px solid #ddd", padding: 12, marginBottom: 10 }}>
            <div><b>Review #{r.id}</b> productId: {r.productId} userId: {r.userId}</div>
            <div>Rating: {r.rating}</div>
            <div>Title: {r.title}</div>
            <div>Content: {r.content}</div>

            <div style={{ marginTop: 8, display:"flex", gap: 8 }}>
              <button onClick={()=>approve(r.id)}>Approve</button>
              <button onClick={()=>reject(r.id)}>Reject</button>
            </div>

            <div style={{ marginTop: 8 }}>
              <textarea
                placeholder="Reply content..."
                value={replyText[r.id] || ""}
                onChange={(e)=>setReplyText({ ...replyText, [r.id]: e.target.value })}
                style={{ width:"100%", minHeight: 60 }}
              />
              <button onClick={()=>reply(r.id)}>Reply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}