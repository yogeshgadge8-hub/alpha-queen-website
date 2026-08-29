import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";
import type { Product } from "@/lib/catalog";

type ProductRow = RowDataPacket & { id: number; name: string; category: string; subtitle: string; price: number; old_price: number | null; shade: string; accent: string; form: Product["form"]; badge: string; size: string; concern: string; active: number };
type InventoryRow = RowDataPacket & { product_id: number; stock: number; low_stock_threshold: number; updated_at: Date };
type MediaRow = RowDataPacket & { id: number; product_id: number; media_type: "image" | "video"; media_url: string; alt_text: string; sort_order: number };
type ReviewRow = RowDataPacket & { id: number; product_id: number; customer_name: string; rating: number; title: string; review_text: string; media_url: string; status: "pending" | "approved" | "rejected"; created_at: Date };

const mapProduct = (row: ProductRow): Product => ({ id: Number(row.id), name: row.name, category: row.category, subtitle: row.subtitle, price: Number(row.price), oldPrice: row.old_price === null ? undefined : Number(row.old_price), rating: 0, reviews: 0, shade: row.shade, accent: row.accent, form: row.form, badge: row.badge || undefined, size: row.size, concern: row.concern, active: Boolean(row.active) });

async function validProductId(value: unknown) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid product");
  const [rows] = await database().query<(RowDataPacket & { id: number })[]>("SELECT id FROM store_products WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw new Error("Invalid product");
  return id;
}

const clean = (value: unknown, max = 255) => String(value ?? "").trim().slice(0, max);
const money = (value: unknown, allowEmpty = false) => {
  if (allowEmpty && (value === "" || value === null || value === undefined)) return null;
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) throw new Error("Enter a valid price");
  return amount;
};
const color = (value: unknown, fallback: string) => /^#[0-9a-f]{6}$/i.test(clean(value, 20)) ? clean(value, 20) : fallback;
const validUrl = (value: unknown) => { const url = clean(value, 1200); if (!url) return ""; const parsed = new URL(url); if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Use a valid http or https media URL"); return parsed.toString(); };

export async function listProducts(includeInactive = false) {
  await ensureSchema();
  const [rows] = await database().query<ProductRow[]>(`SELECT id, name, category, subtitle, price, old_price, shade, accent, form, badge, size, concern, active FROM store_products ${includeInactive ? "" : "WHERE active = 1"} ORDER BY id`);
  return rows.map(mapProduct);
}

export async function publicCatalogState(includeInactive = false) {
  await ensureSchema(); const products = await listProducts(includeInactive);
  const [inventoryRows] = await database().query<InventoryRow[]>("SELECT product_id, stock, low_stock_threshold, updated_at FROM inventory ORDER BY product_id");
  const [mediaRows] = await database().query<MediaRow[]>("SELECT id, product_id, media_type, media_url, alt_text, sort_order FROM product_media ORDER BY product_id, sort_order, id");
  const [reviewRows] = await database().query<ReviewRow[]>("SELECT id, product_id, customer_name, rating, title, review_text, media_url, status, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 200");
  return products.map((product) => { const inventory = inventoryRows.find((row) => Number(row.product_id) === product.id); const reviews = reviewRows.filter((row) => Number(row.product_id) === product.id).map((row) => ({ id: Number(row.id), customerName: row.customer_name, rating: Number(row.rating), title: row.title, text: row.review_text, mediaUrl: row.media_url, createdAt: new Date(row.created_at).toISOString() })); const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0; return { productId: product.id, stock: Number(inventory?.stock ?? 0), lowStockThreshold: Number(inventory?.low_stock_threshold ?? 5), updatedAt: inventory ? new Date(inventory.updated_at).toISOString() : null, rating: Number(rating.toFixed(1)), reviewCount: reviews.length, reviews: reviews.slice(0, 8), media: mediaRows.filter((row) => Number(row.product_id) === product.id).map((row) => ({ id: Number(row.id), type: row.media_type, url: row.media_url, alt: row.alt_text })) }; });
}

export async function publicCatalogSnapshot() { return { products: await listProducts(false), catalog: await publicCatalogState(false) }; }
export async function adminCatalogState() { await ensureSchema(); const [products, catalog] = await Promise.all([listProducts(true), publicCatalogState(true)]); const [reviewRows] = await database().query<ReviewRow[]>("SELECT id, product_id, customer_name, rating, title, review_text, media_url, status, created_at FROM reviews ORDER BY created_at DESC LIMIT 300"); return { products, catalog, reviews: reviewRows.map((row) => ({ id: Number(row.id), productId: Number(row.product_id), customerName: row.customer_name, rating: Number(row.rating), title: row.title, text: row.review_text, mediaUrl: row.media_url, status: row.status, createdAt: new Date(row.created_at).toISOString() })) }; }

function productValues(body: Record<string, unknown>) {
  const name = clean(body.name, 180); const category = clean(body.category, 100); const price = money(body.price);
  if (name.length < 2 || category.length < 2) throw new Error("Product name and category are required");
  const form = ["pump", "tube", "jar"].includes(clean(body.form)) ? clean(body.form) as Product["form"] : "pump";
  return { name, category, subtitle: clean(body.subtitle), price, oldPrice: money(body.oldPrice, true), shade: color(body.shade, "#eaded2"), accent: color(body.accent, "#6f4436"), form, badge: clean(body.badge, 100), size: clean(body.size, 80), concern: clean(body.concern, 160), active: body.active !== false };
}

export async function createProduct(value: unknown) {
  await ensureSchema(); const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>; const p = productValues(body); const now = new Date(); const connection = await database().getConnection();
  try { await connection.beginTransaction(); const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO store_products (name, category, subtitle, price, old_price, shade, accent, form, badge, size, concern, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [p.name, p.category, p.subtitle, p.price, p.oldPrice, p.shade, p.accent, p.form, p.badge, p.size, p.concern, p.active ? 1 : 0, now, now]); await connection.execute("INSERT INTO inventory (product_id, stock, low_stock_threshold, updated_at) VALUES (?, 0, 5, ?)", [result.insertId, now]); await connection.commit(); return result.insertId; } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function updateProduct(value: unknown) { await ensureSchema(); const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>; const id = await validProductId(body.id); const p = productValues(body); await database().execute(`UPDATE store_products SET name=?, category=?, subtitle=?, price=?, old_price=?, shade=?, accent=?, form=?, badge=?, size=?, concern=?, active=?, updated_at=? WHERE id=?`, [p.name, p.category, p.subtitle, p.price, p.oldPrice, p.shade, p.accent, p.form, p.badge, p.size, p.concern, p.active ? 1 : 0, new Date(), id]); }

export async function updateInventory(productIdValue: unknown, stockValue: unknown, thresholdValue: unknown) { await ensureSchema(); const productId = await validProductId(productIdValue); const stock = Math.max(0, Math.min(1_000_000, Math.floor(Number(stockValue) || 0))); const threshold = Math.max(0, Math.min(10_000, Math.floor(Number(thresholdValue) || 0))); await database().execute("INSERT INTO inventory (product_id, stock, low_stock_threshold, updated_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock = VALUES(stock), low_stock_threshold = VALUES(low_stock_threshold), updated_at = VALUES(updated_at)", [productId, stock, threshold, new Date()]); }
export async function addMedia(productIdValue: unknown, typeValue: unknown, urlValue: unknown, altValue: unknown) { await ensureSchema(); const productId = await validProductId(productIdValue); const type = String(typeValue) === "video" ? "video" : "image"; const url = validUrl(urlValue); if (!url) throw new Error("Media URL is required"); await database().execute("INSERT INTO product_media (product_id, media_type, media_url, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)", [productId, type, url, clean(altValue), new Date()]); }
export async function deleteMedia(idValue: unknown) { await ensureSchema(); const id = Number(idValue); if (!Number.isInteger(id) || id < 1) throw new Error("Invalid media item"); await database().execute("DELETE FROM product_media WHERE id = ?", [id]); }

export async function createReview(value: unknown) {
  await ensureSchema(); const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>; const productId = await validProductId(body.productId); const orderId = clean(body.orderId).toUpperCase(); const mobile = String(body.mobile ?? "").replace(/\D/g, "").slice(-10); const customerName = clean(body.customerName, 100); const rating = Math.floor(Number(body.rating)); const title = clean(body.title, 160); const text = clean(body.text, 2500); const mediaUrl = validUrl(body.mediaUrl);
  if (customerName.length < 2) throw new Error("Enter your name"); if (!orderId.startsWith("AQ-") || mobile.length !== 10) throw new Error("Enter a valid paid order number and registered mobile number"); if (rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5"); if (text.length < 10) throw new Error("Review must contain at least 10 characters");
  const [orderRows] = await database().query<(RowDataPacket & { items_json: string })[]>("SELECT items_json FROM orders WHERE id = ? AND mobile = ? AND payment_status = 'paid' LIMIT 1", [orderId, mobile]); const purchasedItems = orderRows[0] ? JSON.parse(orderRows[0].items_json) as { id: string }[] : []; if (!purchasedItems.some((item) => Number(item.id) === productId)) throw new Error("Paid order verification failed for this product"); await database().execute("INSERT INTO reviews (product_id, customer_name, rating, title, review_text, media_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)", [productId, customerName, rating, title, text, mediaUrl, new Date()]);
}
export async function moderateReview(idValue: unknown, statusValue: unknown) { await ensureSchema(); const id = Number(idValue); const status = String(statusValue); if (!Number.isInteger(id) || id < 1 || !["approved", "rejected"].includes(status)) throw new Error("Invalid review action"); await database().execute("UPDATE reviews SET status = ? WHERE id = ?", [status, id]); }
