import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { reviewService } from "../services/reviewService";

const API_ORIGIN = "https://localhost:7020";

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return "Liên hệ";
  return Number(price).toLocaleString("vi-VN") + " ₫";
};

const slugToTitle = (slug = "") => {
  if (!slug) return "Chi tiết sản phẩm";
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const firstError = Object.values(data.errors)?.flat?.()[0];
    if (firstError) return firstError;
  }

  return fallback;
};

export default function DetailProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const [p, setP] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

  const [reviews, setReviews] = useState([]);
  const [rv, setRv] = useState({ rating: 5, title: "", content: "" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [reviewErr, setReviewErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await productService.detail(id);
        setP(res.data);
        setVariantId(res.data?.variants?.[0]?.id ?? null);
      } catch (ex) {
        setErr(getErrorMessage(ex, "Không thể tải chi tiết sản phẩm"));
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      setReviewErr("");

      try {
        const rr = await reviewService.byProduct(id);
        setReviews(rr.data || []);
      } catch (ex) {
        setReviews([]);
        setReviewErr(getErrorMessage(ex, "Không thể tải đánh giá sản phẩm"));
      }
    };

    loadProduct();
    loadReviews();
  }, [id]);

  const currentVariant = useMemo(() => {
    return (p?.variants || []).find((v) => v.id === Number(variantId)) || null;
  }, [p, variantId]);

  const productTitle = p?.name || slugToTitle(p?.slug);

  const imageList = useMemo(() => {
    const rawImages = Array.isArray(p?.images) ? p.images : [];

    const normalizedImages = rawImages
      .map((img) => {
        if (!img) return "";

        if (typeof img === "string") {
          return getImageSrc(img);
        }

        return getImageSrc(
          img.imageUrl || img.url || img.imagePath || img.path || ""
        );
      })
      .filter(Boolean);

    if (normalizedImages.length > 0) return normalizedImages;

    if (p?.imageUrl) return [getImageSrc(p.imageUrl)];

    return ["https://via.placeholder.com/800x600?text=Souvenir+Shop"];
  }, [p]);

  useEffect(() => {
    if (imageList.length > 0) {
      setSelectedImage(imageList[0]);
    }
  }, [imageList]);

  const displayPrice = currentVariant?.price ?? p?.basePrice ?? 0;

  const addToCart = async () => {
    setMsg("");
    setErr("");

    if (!token) {
      nav("/login");
      return;
    }

    try {
      setAddingCart(true);
      await cartService.addItem({
        variantId,
        quantity: Number(qty),
      });
      setMsg("Đã thêm sản phẩm vào giỏ hàng");
    } catch (ex) {
      setErr(getErrorMessage(ex, "Thêm vào giỏ hàng thất bại"));
    } finally {
      setAddingCart(false);
    }
  };

  const submitReview = async () => {
    setMsg("");
    setErr("");
    setReviewErr("");

    try {
      setSubmittingReview(true);
      await reviewService.create({
        productId: Number(id),
        ...rv,
      });

      setMsg("Đánh giá đã được gửi thành công");
      setRv({ rating: 5, title: "", content: "" });

      try {
        const rr = await reviewService.byProduct(id);
        setReviews(rr.data || []);
      } catch (ex) {
        setReviews([]);
        setReviewErr(getErrorMessage(ex, "Không thể tải lại danh sách đánh giá"));
      }
    } catch (ex) {
      setErr(getErrorMessage(ex, "Gửi đánh giá thất bại"));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <MainLayout>
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="mb-4">
            <Link
              to="/products"
              style={{
                color: "#93c5fd",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← Quay lại danh sách sản phẩm
            </Link>
          </div>

          {err && (
            <div className="alert alert-danger" role="alert">
              {err}
            </div>
          )}

          {msg && (
            <div className="alert alert-success" role="alert">
              {msg}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải chi tiết sản phẩm...</p>
            </div>
          ) : !p ? (
            <div className="alert alert-warning">Không tìm thấy sản phẩm.</div>
          ) : (
            <>
              <div className="row g-4 align-items-start">
                <div className="col-lg-6">
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 24,
                      padding: 16,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 20,
                        overflow: "hidden",
                        marginBottom: 16,
                      }}
                    >
                      <img
                        src={selectedImage || imageList[0]}
                        alt={productTitle}
                        style={{
                          width: "100%",
                          height: 500,
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/800x600?text=No+Image";
                        }}
                      />
                    </div>

                    {imageList.length > 1 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {imageList.map((img, index) => (
                          <button
                            key={`${img}-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(img)}
                            style={{
                              border:
                                selectedImage === img
                                  ? "2px solid #2563eb"
                                  : "1px solid #e5e7eb",
                              borderRadius: 14,
                              padding: 4,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <img
                              src={img}
                              alt={`${productTitle}-${index + 1}`}
                              style={{
                                width: "100%",
                                height: 80,
                                objectFit: "cover",
                                borderRadius: 10,
                                display: "block",
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/200x150?text=No+Image";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-6">
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 24,
                      padding: 28,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 16,
                      }}
                    >
                      Sản phẩm lưu niệm
                    </div>

                    <h2
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        marginBottom: 14,
                      }}
                    >
                      {productTitle}
                    </h2>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        color: "#2563eb",
                        marginBottom: 20,
                      }}
                    >
                      {formatPrice(displayPrice)}
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 20,
                        color: "#475569",
                        lineHeight: 1.8,
                      }}
                    >
                      <div>
                        <strong>Slug:</strong> {p.slug || "-"}
                      </div>
                      <div>
                        <strong>Giá gốc:</strong> {formatPrice(p.basePrice)}
                      </div>
                      <div>
                        <strong>Số biến thể:</strong> {p.variants?.length || 0}
                      </div>
                      <div>
                        <strong>Số ảnh:</strong> {imageList.length}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#111827", fontWeight: 600 }}
                      >
                        Chọn biến thể
                      </label>
                      <select
                        className="form-select"
                        value={variantId ?? ""}
                        onChange={(e) => setVariantId(Number(e.target.value))}
                        style={{
                          height: 48,
                          borderRadius: 12,
                          color: "#111827",
                        }}
                        disabled={(p.variants || []).length === 0}
                      >
                        {(p.variants || []).length > 0 ? (
                          (p.variants || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.variantName} - {formatPrice(v.price ?? p.basePrice)}
                            </option>
                          ))
                        ) : (
                          <option value="">Không có biến thể</option>
                        )}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label
                        className="form-label"
                        style={{ color: "#111827", fontWeight: 600 }}
                      >
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        style={{
                          height: 48,
                          borderRadius: 12,
                          color: "#111827",
                          maxWidth: 160,
                        }}
                      />
                    </div>

                    <div className="d-flex gap-3 flex-wrap">
                      <button
                        onClick={addToCart}
                        className="btn btn-primary"
                        disabled={addingCart || !variantId}
                        style={{
                          minWidth: 180,
                          height: 48,
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {addingCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                      </button>

                      <Link
                        to="/cart"
                        className="btn btn-outline-primary"
                        style={{
                          minWidth: 150,
                          height: 48,
                          borderRadius: 12,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Xem giỏ hàng
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-lg-7">
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 24,
                      padding: 28,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        marginBottom: 20,
                      }}
                    >
                      Đánh giá sản phẩm
                    </h3>

                    {reviewErr && (
                      <div className="alert alert-warning" role="alert">
                        {reviewErr}
                      </div>
                    )}

                    {(reviews || []).length === 0 ? (
                      <p style={{ color: "#64748b", marginBottom: 0 }}>
                        Chưa có đánh giá nào cho sản phẩm này.
                      </p>
                    ) : (
                      <div className="d-grid gap-3">
                        {(reviews || []).map((r) => (
                          <div
                            key={r.id}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 18,
                              padding: 18,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#0f172a",
                                }}
                              >
                                {r.rating}★ {r.title}
                              </div>
                            </div>

                            <div style={{ color: "#475569" }}>{r.content}</div>

                            {r.replyContent && (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: 12,
                                  background: "#f8fafc",
                                  borderRadius: 12,
                                  color: "#334155",
                                }}
                              >
                                <strong>Phản hồi từ shop:</strong> {r.replyContent}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-5">
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 24,
                      padding: 28,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        marginBottom: 20,
                      }}
                    >
                      Viết đánh giá
                    </h3>

                    {!token ? (
                      <div
                        style={{
                          background: "#f8fafc",
                          borderRadius: 16,
                          padding: 16,
                          color: "#475569",
                        }}
                      >
                        Bạn cần{" "}
                        <Link to="/login" style={{ fontWeight: 600 }}>
                          đăng nhập
                        </Link>{" "}
                        để gửi đánh giá.
                      </div>
                    ) : (
                      <div className="d-grid gap-3">
                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 600 }}
                          >
                            Số sao
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            className="form-control"
                            value={rv.rating}
                            onChange={(e) =>
                              setRv({ ...rv, rating: Number(e.target.value) })
                            }
                            style={{
                              height: 48,
                              borderRadius: 12,
                              color: "#111827",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 600 }}
                          >
                            Tiêu đề
                          </label>
                          <input
                            className="form-control"
                            placeholder="Nhập tiêu đề đánh giá"
                            value={rv.title}
                            onChange={(e) =>
                              setRv({ ...rv, title: e.target.value })
                            }
                            style={{
                              height: 48,
                              borderRadius: 12,
                              color: "#111827",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            className="form-label"
                            style={{ color: "#111827", fontWeight: 600 }}
                          >
                            Nội dung
                          </label>
                          <textarea
                            className="form-control"
                            rows={5}
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
                            value={rv.content}
                            onChange={(e) =>
                              setRv({ ...rv, content: e.target.value })
                            }
                            style={{
                              borderRadius: 12,
                              color: "#111827",
                            }}
                          />
                        </div>

                        <button
                          onClick={submitReview}
                          className="btn btn-primary"
                          disabled={submittingReview}
                          style={{
                            height: 48,
                            borderRadius: 12,
                            fontWeight: 600,
                          }}
                        >
                          {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}