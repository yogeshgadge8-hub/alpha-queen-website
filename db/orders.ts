import { env } from "cloudflare:workers";
import { products } from "@/lib/catalog";

export type OrderItem = { id: string; name: string; qty: number; price: number };
export type OrderInput = {
  source: "website" | "instagram" | "whatsapp";
  customerName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  items: OrderItem[];
  shipping?: number;
  paymentStatus?: "pending" | "paid";
  note?: string;
};

export type OrderRecord = OrderInput & {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  createdAt: string;
};

const createOrdersSql = `CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT NOT NULL DEFAULT '',
  landmark TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
)`;

async function database() {
  const db = env.DB;
  if (!db) throw new Error("Order database is not configured");
  await db.batch([
    db.prepare(createOrdersSql),
    db.prepare("CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS orders_mobile_idx ON orders(mobile)"),
  ]);
  return db;
}

const clean = (value: unknown) => String(value ?? "").trim();

export function validateOrder(value: unknown): OrderInput {
  const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const source = clean(body.source).toLowerCase();
  if (!(["website", "instagram", "whatsapp"] as string[]).includes(source)) throw new Error("Select a valid order source");
  const mobile = clean(body.mobile).replace(/\D/g, "").slice(-10);
  if (mobile.length !== 10) throw new Error("Enter a valid 10-digit mobile number");
  const pincode = clean(body.pincode).replace(/\D/g, "");
  if (pincode.length !== 6) throw new Error("Enter a valid 6-digit PIN code");
  let items = Array.isArray(body.items) ? body.items.map((item) => {
    const record = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return { id: clean(record.id), name: clean(record.name), qty: Math.max(1, Math.floor(Number(record.qty) || 1)), price: Math.max(0, Math.round(Number(record.price) || 0)) };
  }).filter((item) => item.name) : [];
  if (source === "website") {
    items = items.map((item) => {
      const product = products.find((candidate) => String(candidate.id) === item.id);
      if (!product || product.badge === "Coming soon") throw new Error("One or more products are not available for checkout");
      return { id: String(product.id), name: product.name, qty: item.qty, price: product.price };
    });
  }
  if (!items.length) throw new Error("Add at least one product");
  const required = ["customerName", "addressLine1", "city", "state"] as const;
  for (const field of required) if (!clean(body[field])) throw new Error("Complete all required customer and address fields");
  return {
    source: source as OrderInput["source"], customerName: clean(body.customerName), mobile,
    addressLine1: clean(body.addressLine1), addressLine2: clean(body.addressLine2), landmark: clean(body.landmark),
    pincode, city: clean(body.city), state: clean(body.state), items,
    shipping: Math.max(0, Math.round(Number(body.shipping) || 0)),
    paymentStatus: clean(body.paymentStatus) === "paid" ? "paid" : "pending", note: clean(body.note),
  };
}

export async function createOrder(input: OrderInput): Promise<OrderRecord> {
  const db = await database();
  const id = `AQ-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = input.shipping ?? 0;
  const total = subtotal + shipping;
  const createdAt = new Date().toISOString();
  await db.prepare(`INSERT INTO orders (id, source, status, customer_name, mobile, address_line1, address_line2, landmark, pincode, city, state, items_json, subtotal, shipping, total, payment_status, note, created_at)
    VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, input.source, input.customerName, input.mobile, input.addressLine1, input.addressLine2 ?? "", input.landmark ?? "", input.pincode, input.city, input.state, JSON.stringify(input.items), subtotal, shipping, total, input.paymentStatus ?? "pending", input.note ?? "", createdAt).run();
  return { ...input, id, status: "new", subtotal, shipping, total, createdAt };
}

export async function listOrders(): Promise<OrderRecord[]> {
  const db = await database();
  const result = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500").all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: String(row.id), source: String(row.source) as OrderRecord["source"], status: String(row.status),
    customerName: String(row.customer_name), mobile: String(row.mobile), addressLine1: String(row.address_line1),
    addressLine2: String(row.address_line2 ?? ""), landmark: String(row.landmark ?? ""), pincode: String(row.pincode),
    city: String(row.city), state: String(row.state), items: JSON.parse(String(row.items_json)) as OrderItem[],
    subtotal: Number(row.subtotal), shipping: Number(row.shipping), total: Number(row.total),
    paymentStatus: String(row.payment_status) === "paid" ? "paid" : "pending", note: String(row.note ?? ""), createdAt: String(row.created_at),
  }));
}

export async function updateOrderStatus(id: string, status: string) {
  const allowed = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid order status");
  const db = await database();
  await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
}

export async function deleteOrder(id: string) {
  if (!id.startsWith("AQ-")) throw new Error("Invalid order id");
  const db = await database();
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
}
