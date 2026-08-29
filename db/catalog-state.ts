import type { RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";
import { products } from "@/lib/catalog";

type InventoryRow = RowDataPacket & { product_id: number; stock: number; low_stock_threshold: number; updated_at: Date };
type MediaRow = RowDataPacket & { id: number; product_id: number; media_type: "image" | "video"; media_url: string; alt_text: string; sort_order: number };
type ReviewRow = RowDataPacket & { id: number; product_id: number; customer_name: string; rating: number; title: string; review_text: string; media_url: string; status: "pending" | "approved" | "rejected"; created_at: Date };

const validProductId = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id) || !products.some((product) => product.id === id)) throw new Error("Invalid product");
  return id;
};

const validUrl = (value: unknown) => {
  const url = String(value ?? "").trim();
  if (!url) return "";
  const parsed = new URL(url);
  if (!(["https:", "http:"].includes(parsed.protocol))) throw new Error("Use a valid http or https media URL");
  return parsed.toString();
};

export async function publicCatalogState() {
  await ensureSchema();
  const [inventoryRows] = await database().query<InventoryRow[]>("SELECT product_id, stock, low_stock_threshold, updated_at FROM inventory ORDER BY product_id");
  const [mediaRows] = await database().query<MediaRow[]>("SELECT id, product_id, media_type, media_url, alt_text, sort_order FROM product_media ORDER BY product_id, sort_order, id");
  const [reviewRows] = await database().query<ReviewRow[]>("SELECT id, product_id, customer_name, rating, title, review_text, media_url, status, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 200");
  return products.map((product) => {
    const inventory = inventoryRows.find((row) => Number(row.product_id) === product.id);
    const reviews = reviewRows.filter((row) => Number(row.product_id) === product.id).map((row) => ({ id: Number(row.id), customerName: row.customer_name, rating: Number(row.rating), title: row.title, text: row.review_text, mediaUrl: row.media_url, createdAt: new Date(row.created_at).toISOString() }));
    const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    return {
      productId: product.id,
      stock: Number(inventory?.stock ?? 0),
      lowStockThreshold: Number(inventory?.low_stock_threshold ?? 5),
      updatedAt: inventory ? new Date(inventory.updated_at).toISOString() : null,
      rating: Number(rating.toFixed(1)),
      reviewCount: reviews.length,
      reviews: reviews.slice(0, 8),
      media: mediaRows.filter((row) => Number(row.product_id) === product.id).map((row) => ({ id: Number(row.id), type: row.media_type, url: row.media_url, alt: row.alt_text })),
    };
  });
}

export async function adminCatalogState() {
  await ensureSchema();
  const catalog = await publicCatalogState();
  const [reviewRows] = await database().query<ReviewRow[]>("SELECT id, product_id, customer_name, rating, title, review_text, media_url, status, created_at FROM reviews ORDER BY created_at DESC LIMIT 300");
  return { catalog, reviews: reviewRows.map((row) => ({ id: Number(row.id), productId: Number(row.product_id), customerName: row.customer_name, rating: Number(row.rating), title: row.title, text: row.review_text, mediaUrl: row.media_url, status: row.status, createdAt: new Date(row.created_at).toISOString() })) };
}

export async function updateInventory(productIdValue: unknown, stockValue: unknown, thresholdValue: unknown) {
  await ensureSchema();
  const productId = validProductId(productIdValue);
  const stock = Math.max(0, Math.min(1_000_000, Math.floor(Number(stockValue) || 0)));
  const threshold = Math.max(0, Math.min(10_000, Math.floor(Number(thresholdValue) || 0)));
  await database().execute("INSERT INTO inventory (product_id, stock, low_stock_threshold, updated_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock = VALUES(stock), low_stock_threshold = VALUES(low_stock_threshold), updated_at = VALUES(updated_at)", [productId, stock, threshold, new Date()]);
}

export async function addMedia(productIdValue: unknown, typeValue: unknown, urlValue: unknown, altValue: unknown) {
  await ensureSchema();
  const productId = validProductId(productIdValue);
  const type = String(typeValue) === "video" ? "video" : "image";
  const url = validUrl(urlValue);
  if (!url) throw new Error("Media URL is required");
  await database().execute("INSERT INTO product_media (product_id, media_type, media_url, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)", [productId, type, url, String(altValue ?? "").trim().slice(0, 255), new Date()]);
}

export async function deleteMedia(idValue: unknown) {
  await ensureSchema();
  const id = Number(idValue);
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid media item");
  await database().execute("DELETE FROM product_media WHERE id = ?", [id]);
}

export async function createReview(value: unknown) {
  await ensureSchema();
  const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const productId = validProductId(body.productId);
  const customerName = String(body.customerName ?? "").trim().slice(0, 100);
  const rating = Math.floor(Number(body.rating));
  const title = String(body.title ?? "").trim().slice(0, 160);
  const text = String(body.text ?? "").trim().slice(0, 2500);
  const mediaUrl = validUrl(body.mediaUrl);
  if (customerName.length < 2) throw new Error("Enter your name");
  if (rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5");
  if (text.length < 10) throw new Error("Review must contain at least 10 characters");
  await database().execute("INSERT INTO reviews (product_id, customer_name, rating, title, review_text, media_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)", [productId, customerName, rating, title, text, mediaUrl, new Date()]);
}

export async function moderateReview(idValue: unknown, statusValue: unknown) {
  await ensureSchema();
  const id = Number(idValue);
  const status = String(statusValue);
  if (!Number.isInteger(id) || id < 1 || !["approved", "rejected"].includes(status)) throw new Error("Invalid review action");
  await database().execute("UPDATE reviews SET status = ? WHERE id = ?", [status, id]);
}
