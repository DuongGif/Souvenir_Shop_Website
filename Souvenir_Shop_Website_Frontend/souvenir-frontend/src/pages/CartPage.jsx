import React, { useEffect, useState } from "react";
import { cartService } from "../services/cartService";
import { couponService } from "../services/couponService";
import { orderService } from "../services/orderService";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const nav = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, cartId: 0 });
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await cartService.get();
    setCart(res.data);
  };

  useEffect(() => { load().catch(() => setErr("Load cart failed")); }, []);

  const updateQty = async (itemId, quantity) => {
    setErr(""); setMsg("");
    try {
      await cartService.updateItem(itemId, { quantity });
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Update failed"); }
  };

  const removeItem = async (itemId) => {
    setErr(""); setMsg("");
    try {
      await cartService.deleteItem(itemId);
      await load();
    } catch (ex) { setErr(ex?.response?.data ?? "Delete failed"); }
  };

  const validateCoupon = async () => {
    setErr(""); setMsg(""); setCouponInfo(null);
    try {
      const res = await couponService.validate({ code: couponCode, subtotal: cart.subtotal });
      setCouponInfo(res.data);
    } catch (ex) {
      setErr(ex?.response?.data ?? "Validate coupon failed");
    }
  };

  const checkout = async () => {
    setErr(""); setMsg("");
    try {
      // ✅ shippingAddressId bạn cần có địa chỉ của user (hiện demo: 1)
      const payload = {
        shippingAddressId: 1,
        fulfillmentType: "delivery"
      };
      if (couponCode.trim()) payload.couponCode = couponCode.trim();

      const res = await orderService.create(payload);
      const orderCode = res.data.orderCode;
      nav(`/payment/${orderCode}`);
    } catch (ex) {
      setErr(ex?.response?.data ?? "Create order failed");
    }
  };

  return (
    <div>
      <h2>Cart</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      {(cart.items || []).map(it => (
        <div key={it.id} style={{ border:"1px solid #ddd", padding: 10, marginBottom: 8 }}>
          <b>{it.variantName}</b>
          <div>Price: {it.price} | Qty: {it.quantity} | Line: {it.lineTotal}</div>

          <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
            <input type="number" min={1} defaultValue={it.quantity}
              onBlur={(e)=>updateQty(it.id, Number(e.target.value))}
              style={{ width: 80 }} />
            <button onClick={()=>removeItem(it.id)}>Remove</button>
          </div>
          <small>Tip: đổi số lượng rồi click ra ngoài để update</small>
        </div>
      ))}

      <h3>Subtotal: {cart.subtotal}</h3>

      <div style={{ display:"flex", gap: 8, marginTop: 10 }}>
        <input placeholder="Coupon code" value={couponCode} onChange={(e)=>setCouponCode(e.target.value)} />
        <button onClick={validateCoupon}>Validate</button>
      </div>

      {couponInfo && (
        <div style={{ marginTop: 8, border:"1px dashed #999", padding: 10 }}>
          <div>Valid: {String(couponInfo.isValid)}</div>
          <div>Message: {couponInfo.message}</div>
          <div>DiscountAmount: {couponInfo.discountAmount}</div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={checkout} disabled={(cart.items || []).length === 0}>Checkout</button>
      </div>
    </div>
  );
}