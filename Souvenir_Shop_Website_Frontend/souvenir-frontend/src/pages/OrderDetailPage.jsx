import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderService } from "../services/orderService";

export default function OrderDetailPage() {
  const { orderCode } = useParams();
  const [o, setO] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    orderService.byCode(orderCode)
      .then(res => setO(res.data))
      .catch(ex => setErr(ex?.response?.data ?? "Load order failed"));
  }, [orderCode]);

  if (err) return <div style={{ color:"red" }}>{String(err)}</div>;
  if (!o) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/orders">← Back</Link>
      <h2>Order: {o.orderCode}</h2>
      <div>Status: {o.status}</div>
      <div>Subtotal: {o.subtotal}</div>
      <div>Total: {o.totalAmount}</div>

      <h3>Items</h3>
      {(o.items || []).map((it, idx) => (
        <div key={idx} style={{ border:"1px solid #ddd", padding: 10, marginBottom: 8 }}>
          <b>{it.productName}</b> - {it.variantName}
          <div>{it.quantity} x {it.unitPrice} = {it.lineTotal}</div>
        </div>
      ))}
    </div>
  );
}