"use client";

import { useCallback, useEffect, useState } from "react";
import { products } from "@/lib/catalog";

type Media = { id: number; type: "image" | "video"; url: string; alt: string };
type CatalogState = { productId: number; stock: number; lowStockThreshold: number; rating: number; reviewCount: number; media: Media[] };
type Review = { id: number; productId: number; customerName: string; rating: number; title: string; text: string; mediaUrl: string; status: "pending" | "approved" | "rejected"; createdAt: string };

export default function CatalogAdminPage() {
  const [catalog, setCatalog] = useState<CatalogState[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { stock: string; threshold: string; type: "image" | "video"; url: string }>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/catalog?admin=1", { cache: "no-store" });
    const data = await response.json() as { catalog?: CatalogState[]; reviews?: Review[]; error?: string };
    if (!response.ok) { setMessage(data.error ?? "Unable to load catalog"); return; }
    setCatalog(data.catalog ?? []); setReviews(data.reviews ?? []);
    setDrafts((current) => Object.fromEntries((data.catalog ?? []).map((item) => [item.productId, current[item.productId] ?? { stock: String(item.stock), threshold: String(item.lowStockThreshold), type: "image", url: "" }])));
  }, []);

  useEffect(() => { void load(); }, [load]);
  const draft = (productId: number) => drafts[productId] ?? { stock: "0", threshold: "5", type: "image" as const, url: "" };
  const updateDraft = (productId: number, patch: Partial<ReturnType<typeof draft>>) => setDrafts((current) => ({ ...current, [productId]: { ...draft(productId), ...patch } }));

  const saveStock = async (productId: number) => {
    const value = draft(productId);
    const response = await fetch("/api/catalog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, stock: value.stock, lowStockThreshold: value.threshold }) });
    const data = await response.json() as { error?: string };
    setMessage(response.ok ? "Stock updated" : data.error ?? "Unable to update stock"); if (response.ok) await load();
  };
  const addMedia = async (productId: number) => {
    const value = draft(productId);
    const response = await fetch("/api/catalog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, type: value.type, url: value.url, alt: products.find((product) => product.id === productId)?.name }) });
    const data = await response.json() as { error?: string };
    setMessage(response.ok ? "Media added" : data.error ?? "Unable to add media"); if (response.ok) { updateDraft(productId, { url: "" }); await load(); }
  };
  const removeMedia = async (id: number) => { await fetch("/api/catalog", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); await load(); };
  const moderate = async (id: number, status: "approved" | "rejected") => { await fetch("/api/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) }); await load(); };

  return <main className="catalog-admin-page"><header className="orders-header"><div><a href="/" className="orders-logo">ALPHA QUEEN<span>catalog desk</span></a><p>Real stock, product images/videos and customer review moderation.</p></div><div><a href="/admin/orders">Order desk</a><a href="/">View store</a></div></header>{message && <div className="catalog-message">{message}</div>}<section className="catalog-admin-shell"><div className="catalog-admin-title"><small>LIVE INVENTORY</small><h1>Stock & product media</h1><p>Stock starts at zero. Enter actual physical units only. Website shows In stock, Only X remaining or Out of stock from this data.</p></div><div className="catalog-admin-grid">{products.map((product) => { const state = catalog.find((item) => item.productId === product.id); const value = draft(product.id); return <article className="catalog-admin-card" key={product.id}><div><small>{product.category} · {product.size}</small><h2>{product.name}</h2><span>{state?.reviewCount ?? 0} approved review(s) · {state?.rating || "No rating"}</span></div><div className="stock-editor"><label><span>Available stock</span><input type="number" min="0" value={value.stock} onChange={(event) => updateDraft(product.id, { stock: event.target.value })} /></label><label><span>Low-stock warning</span><input type="number" min="0" value={value.threshold} onChange={(event) => updateDraft(product.id, { threshold: event.target.value })} /></label><button onClick={() => void saveStock(product.id)}>Save stock</button></div><div className="media-editor"><select value={value.type} onChange={(event) => updateDraft(product.id, { type: event.target.value as "image" | "video" })}><option value="image">Image URL</option><option value="video">Video URL</option></select><input type="url" placeholder="https://..." value={value.url} onChange={(event) => updateDraft(product.id, { url: event.target.value })} /><button onClick={() => void addMedia(product.id)}>Add</button></div>{state?.media.map((media) => <div className="media-row" key={media.id}><span>{media.type}: {media.url}</span><button onClick={() => void removeMedia(media.id)}>Remove</button></div>)}</article>; })}</div><div className="catalog-admin-title review-admin-title"><small>CUSTOMER REVIEWS</small><h1>Approve before publishing</h1><p>New reviews stay pending. Only approved reviews affect the public rating.</p></div><div className="review-admin-list">{reviews.length === 0 ? <p>No reviews submitted yet.</p> : reviews.map((review) => <article key={review.id}><div><b>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</b><span>{review.status}</span></div><h3>{review.title || "Customer review"}</h3><p>{review.text}</p><small>{review.customerName} · {products.find((product) => product.id === review.productId)?.name} · {new Date(review.createdAt).toLocaleString("en-IN")}</small>{review.mediaUrl && <a href={review.mediaUrl} target="_blank" rel="noreferrer">View review media</a>}<footer><button onClick={() => void moderate(review.id, "approved")}>Approve</button><button onClick={() => void moderate(review.id, "rejected")}>Reject</button></footer></article>)}</div></section></main>;
}
