import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { reviewService } from "../services/reviewService";

export default function DetailProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const [p, setP] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [rv, setRv] = useState({ rating: 5, title:"", content:"" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      const res = await productService.detail(id);
      setP(res.data);
      setVariantId(res.data?.variants?.[0]?.id ?? null);

      const rr = await reviewService.byProduct(id);
      setReviews(rr.data || []);
    })().catch(ex => setErr(ex?.response?.data ?? "Load failed"));
  }, [id]);

  const addToCart = async () => {
    setMsg(""); setErr("");
    if (!token) return nav("/login");
    try {
      await cartService.addItem({ variantId, quantity: Number(qty) });
      setMsg("Added to cart!");
    } catch (ex) {
      setErr(ex?.response?.data ?? "Add to cart failed");
    }
  };

  const submitReview = async () => {
    setMsg(""); setErr("");
    try {
      await reviewService.create({ productId: Number(id), ...rv });
      setMsg("Review submitted (pending approval).");
    } catch (ex) {
      setErr(ex?.response?.data ?? "Submit review failed");
    }
  };

  if (!p) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/products">← Back</Link>
      <h2>{p.slug}</h2>

      {err && <div style={{ color:"red" }}>{String(err)}</div>}
      {msg && <div style={{ color:"green" }}>{msg}</div>}

      <div>Base price: {p.basePrice ?? 0}</div>

      <div style={{ marginTop: 10 }}>
        <label>Variant: </label>
        <select value={variantId ?? ""} onChange={(e)=>setVariantId(Number(e.target.value))}>
          {(p.variants || []).map(v => (
            <option key={v.id} value={v.id}>{v.variantName} - {v.price ?? p.basePrice}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Qty: </label>
        <input type="number" min={1} value={qty} onChange={(e)=>setQty(e.target.value)} style={{ width: 80 }} />
        <button onClick={addToCart} style={{ marginLeft: 8 }}>Add to cart</button>
      </div>

      <hr style={{ margin:"16px 0" }} />

      <h3>Reviews</h3>
      {(reviews || []).map(r => (
        <div key={r.id} style={{ border:"1px solid #ddd", padding: 10, marginBottom: 8 }}>
          <div><b>{r.rating}★</b> {r.title}</div>
          <div>{r.content}</div>
          {r.replyContent && (
            <div style={{ marginTop: 8, padding: 8, background: "#f7f7f7" }}>
              <b>Shop reply:</b> {r.replyContent}
            </div>
          )}
        </div>
      ))}

      {token && (
        <div style={{ marginTop: 16, maxWidth: 500 }}>
          <h4>Write a review</h4>
          <div style={{ display:"grid", gap: 8 }}>
            <input type="number" min={1} max={5} value={rv.rating}
              onChange={(e)=>setRv({...rv, rating:Number(e.target.value)})}/>
            <input placeholder="Title" value={rv.title} onChange={(e)=>setRv({...rv, title:e.target.value})}/>
            <textarea placeholder="Content" value={rv.content} onChange={(e)=>setRv({...rv, content:e.target.value})}/>
            <button onClick={submitReview}>Submit review</button>
          </div>
        </div>
      )}
    </div>
  );
}