import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { paymentService } from "../services/paymentService";

export default function PaymentPage() {
  const { orderCode } = useParams();
  const [method, setMethod] = useState("cod");
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const loadLatest = async () => {
    try {
      const res = await paymentService.byOrderCode(orderCode);
      setPayment(res.data);
    } catch {
      // chưa có payment cũng ok
    }
  };

  useEffect(() => { loadLatest(); }, [orderCode]);

  const create = async () => {
    setErr(""); setMsg("");
    try {
      const res = await paymentService.create({ orderCode, paymentMethod: method });
      setPayment(res.data);
    } catch (ex) {
      setErr(ex?.response?.data ?? "Create payment failed");
    }
  };

  const confirm = async () => {
    setErr(""); setMsg("");
    try {
      const res = await paymentService.confirm({ orderCode });
      setMsg(JSON.stringify(res.data));
      await loadLatest();
    } catch (ex) {
      setErr(ex?.response?.data ?? "Confirm failed");
    }
  };

  return (
    <div>
      <h2>Payment</h2>
      <div>OrderCode: <b>{orderCode}</b></div>

      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      <div style={{ display:"flex", gap: 8, alignItems:"center", marginTop: 10 }}>
        <select value={method} onChange={(e)=>setMethod(e.target.value)}>
          <option value="cod">COD</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="momo">Momo (mock)</option>
          <option value="vnpay">VNPay (mock)</option>
        </select>
        <button onClick={create}>Create Payment</button>
        <button onClick={confirm}>Confirm (mock)</button>
      </div>

      {payment && (
        <div style={{ marginTop: 12, border:"1px solid #ddd", padding: 10 }}>
          <div>Method: {payment.paymentMethod}</div>
          <div>Status: {payment.status}</div>
          <div>Amount: {payment.amount}</div>
          {payment.transactionCode && <div>Txn: {payment.transactionCode}</div>}
          {payment.paymentUrl && <div>PayUrl: {payment.paymentUrl}</div>}
        </div>
      )}
    </div>
  );
}