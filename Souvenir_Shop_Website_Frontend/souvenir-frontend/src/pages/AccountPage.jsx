import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function AccountPage() {
  const { register } = useContext(AuthContext);

  const [form, setForm] = useState({ fullName:"", phone:"", email:"", password:"" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await register(form);
      setMsg("Register success! Now login.");
    } catch (ex) {
      setErr(ex?.response?.data ?? "Register failed");
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h2>Account / Register</h2>
      {msg && <div style={{ color:"green" }}>{msg}</div>}
      {err && <div style={{ color:"red" }}>{String(err)}</div>}

      <form onSubmit={submit} style={{ display:"grid", gap: 8 }}>
        <input placeholder="Full name" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})}/>
        <input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})}/>
        <input placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
        <input placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})}/>
        <button>Create account</button>
      </form>
    </div>
  );
}