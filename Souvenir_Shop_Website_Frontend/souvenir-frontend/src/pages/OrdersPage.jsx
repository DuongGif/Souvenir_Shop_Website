import React, { useEffect, useState } from "react";
import { orderService } from "../services/orderService";
import { Link } from "react-router-dom";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    orderService.my()
      .then(res => setOrders(res.data || []))
      .catch(ex => setErr(ex?.response?.data ?? "Load orders failed"));
  }, []);

  return (
    <div>
      <h2>My Orders</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}

      {orders.map(o => (
        <div key={o.orderCode} style={{ border:"1px solid #ddd", padding: 10, marginBottom: 8 }}>
          <b>{o.orderCode}</b> - {o.status}
          <div>Total: {o.totalAmount}</div>
          <Link to={`/orders/${o.orderCode}`}>View detail</Link>
        </div>
      ))}
    </div>
  );
}