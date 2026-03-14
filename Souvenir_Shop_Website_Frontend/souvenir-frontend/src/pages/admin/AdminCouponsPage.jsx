import React, { useEffect, useState } from "react";
import { adminCouponsService } from "../../services/admin/adminCouponsService";

export default function AdminCouponsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    minimumOrderValue: 0,
    maximumDiscount: null,
    totalUsageLimit: null,
    perUserLimit: null,
    isActive: true
  });

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await adminCouponsService.getAll();
    setList(res.data || []);
  };

  useEffect(() => { load().catch(ex => setErr(ex?.response?.data ?? "Load failed")); }, []);

  const create = async () => {
    setErr(""); setMsg("");
    try {
      await adminCouponsService.create(form);
      setMsg("Created coupon " + form.code);
      setForm({ ...form, code: "" });
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Create failed"); }
  };

  const remove = async (code) => {
    setErr(""); setMsg("");
    try {
      await adminCouponsService.remove(code);
      setMsg("Deleted " + code);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Delete failed"); }
  };

  return (
    <div>
      <h2>Admin Coupons</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      <h3>Create coupon</h3>
      <div style={{ display:"grid", gap: 8, maxWidth: 520 }}>
        <input placeholder="CODE e.g. SALE10" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})}/>
        <select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})}>
          <option value="percentage">percentage</option>
          <option value="fixed">fixed</option>
          <option value="free_shipping">free_shipping</option>
        </select>
        <input type="number" placeholder="value" value={form.value} onChange={(e)=>setForm({...form, value:Number(e.target.value)})}/>
        <input type="number" placeholder="minimumOrderValue" value={form.minimumOrderValue} onChange={(e)=>setForm({...form, minimumOrderValue:Number(e.target.value)})}/>
        <label>
          <input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form, isActive:e.target.checked})}/>
          Active
        </label>
        <button onClick={create}>Create</button>
      </div>

      <h3 style={{ marginTop: 16 }}>List</h3>
      <table width="100%" border="1" cellPadding="8" style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Active</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map(c => (
            <tr key={c.code}>
              <td>{c.code}</td>
              <td>{c.type}</td>
              <td>{c.value}</td>
              <td>{c.minimumOrderValue ?? ""}</td>
              <td>{String(c.isActive)}</td>
              <td><button onClick={()=>remove(c.code)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}