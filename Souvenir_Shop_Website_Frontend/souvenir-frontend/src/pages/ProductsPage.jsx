import React, { useEffect, useMemo, useState } from "react";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function ProductsPage() {
  const [q, setQ] = useState({
    keyword: "",
    categoryIds: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    inStockOnly: false,
    sort: "newest",
    page: 1,
    pageSize: 12
  });

  const [data, setData] = useState({ items: [], totalItems: 0, page: 1, pageSize: 12 });
  const [err, setErr] = useState("");

  const params = useMemo(() => {
    const p = { ...q };
    Object.keys(p).forEach(k => (p[k] === "" || p[k] === null) && delete p[k]);
    return p;
  }, [q]);

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const res = await productService.search(params);
        setData(res.data);
      } catch (ex) {
        setErr(ex?.response?.data ?? "Load products failed");
      }
    })();
  }, [params]);

  const totalPages = Math.max(1, Math.ceil((data.totalItems || 0) / (data.pageSize || 12)));

  return (
    <div>
      <h2>Products</h2>
      {err && <div style={{ color:"red" }}>{String(err)}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap: 16 }}>
        <div style={{ border:"1px solid #ddd", padding: 12 }}>
          <div style={{ display:"grid", gap: 8 }}>
            <input placeholder="keyword" value={q.keyword} onChange={(e)=>setQ({...q, keyword:e.target.value, page:1})}/>
            <input placeholder="categoryIds (1,2,3)" value={q.categoryIds} onChange={(e)=>setQ({...q, categoryIds:e.target.value, page:1})}/>
            <input placeholder="minPrice" value={q.minPrice} onChange={(e)=>setQ({...q, minPrice:e.target.value, page:1})}/>
            <input placeholder="maxPrice" value={q.maxPrice} onChange={(e)=>setQ({...q, maxPrice:e.target.value, page:1})}/>
            <input placeholder="minRating (e.g. 4)" value={q.minRating} onChange={(e)=>setQ({...q, minRating:e.target.value, page:1})}/>
            <label style={{ display:"flex", gap: 8, alignItems:"center" }}>
              <input type="checkbox" checked={q.inStockOnly} onChange={(e)=>setQ({...q, inStockOnly:e.target.checked, page:1})}/>
              In stock only
            </label>
            <select value={q.sort} onChange={(e)=>setQ({...q, sort:e.target.value, page:1})}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price asc</option>
              <option value="price_desc">Price desc</option>
              <option value="rating_desc">Rating desc</option>
              <option value="rating_asc">Rating asc</option>
            </select>
          </div>
        </div>

        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 12 }}>
            {(data.items || []).map(p => <ProductCard key={p.id} p={p} />)}
          </div>

          <Pagination
            page={q.page}
            totalPages={totalPages}
            onPrev={() => setQ({ ...q, page: q.page - 1 })}
            onNext={() => setQ({ ...q, page: q.page + 1 })}
          />
        </div>
      </div>
    </div>
  );
}