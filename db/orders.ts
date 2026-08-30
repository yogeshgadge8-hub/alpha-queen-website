import type { RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";
import { listProducts } from "@/db/catalog-state";

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

type OrderRow = RowDataPacket & {
  id: string; source: OrderRecord["source"]; status: string; customer_name: string; mobile: string;
  address_line1: string; address_line2: string; landmark: string; pincode: string; city: string; state: string;
  items_json: string; subtotal: number; shipping: number; total: number; payment_status: string; note: string; created_at: Date;
};

const clean = (value: unknown) => String(value ?? "").trim();

export async function validateOrder(value: unknown): Promise<OrderInput> {
  const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const source = clean(body.source).toLowerCase();
  if (!("website instagram whatsapp".split(" ")).includes(source)) throw new Error("Select a valid order source");
  const mobile = clean(body.mobile).replace(/\D/g, "").slice(-10);
  if (mobile.length !== 10) throw new Error("Enter a valid 10-digit mobile number");
  const pincode = clean(body.pincode).replace(/\D/g, "");
  if (pincode.length !== 6) throw new Error("Enter a valid 6-digit PIN code");
  let items = Array.isArray(body.items) ? body.items.map((item) => {
    const record = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return { id: clean(record.id), name: clean(record.name), qty: Math.max(1, Math.min(25, Math.floor(Number(record.qty) || 1))), price: Math.max(0, Math.round(Number(record.price) || 0)) };
  }).filter((item) => item.name) : [];

  if (source === "website") {
    const products = await listProducts(false);
    items = items.map((item) => {
      const product = products.find((candidate) => String(candidate.id) === item.id);
      if (!product) throw new Error("One or more products are not available for checkout");
      return { id: String(product.id), name: product.name, qty: item.qty, price: product.price };
    });
  }
  if (!items.length) throw new Error("Add at least one product");
  for (const field of ["customerName", "addressLine1", "city", "state"] as const) {
    if (!clean(body[field])) throw new Error("Complete all required customer and address fields");
  }
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    source: source as OrderInput["source"], customerName: clean(body.customerName), mobile,
    addressLine1: clean(body.addressLine1), addressLine2: clean(body.addressLine2), landmark: clean(body.landmark),
    pincode, city: clean(body.city), state: clean(body.state), items,
    shipping: source === "website" ? (subtotal >= 699 ? 0 : 75) : Math.max(0, Math.round(Number(body.shipping) || 0)),
    paymentStatus: source === "website" ? "pending" : clean(body.paymentStatus) === "paid" ? "paid" : "pending",
    note: clean(body.note),
  };
}

export async function createOrder(input: OrderInput): Promise<OrderRecord> {
  await ensureSchema();
  if (input.source === "website") {
    for (const item of input.items) {
      const [inventoryRows] = await database().query<(RowDataPacket & { stock: number })[]>("SELECT stock FROM inventory WHERE product_id = ? LIMIT 1", [Number(item.id)]);
      const stock = Number(inventoryRows[0]?.stock ?? 0);
      if (stock < item.qty) throw new Error(`${item.name} has only ${stock} unit(s) in stock`);
    }
  }
  const uniqueSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const id = `AQ-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${uniqueSuffix}`;
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = input.shipping ?? 0;
  const total = subtotal + shipping;
  const createdAt = new Date();
  const initialStatus = input.paymentStatus === "paid" ? "confirmed" : "new";
  await database().execute(`INSERT INTO orders
    (id, source, status, customer_name, mobile, address_line1, address_line2, landmark, pincode, city, state, items_json, subtotal, shipping, total, payment_status, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.source, initialStatus, input.customerName, input.mobile, input.addressLine1, input.addressLine2 ?? "", input.landmark ?? "", input.pincode, input.city, input.state, JSON.stringify(input.items), subtotal, shipping, total, input.paymentStatus ?? "pending", input.note ?? "", createdAt]);
  return { ...input, id, status: initialStatus, subtotal, shipping, total, createdAt: createdAt.toISOString() };
}

export async function listOrders(): Promise<OrderRecord[]> {
  await ensureSchema();
  const [rows] = await database().query<OrderRow[]>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500");
  return rows.map((row) => ({
    id: row.id, source: row.source, status: row.status, customerName: row.customer_name, mobile: row.mobile,
    addressLine1: row.address_line1, addressLine2: row.address_line2, landmark: row.landmark, pincode: row.pincode,
    city: row.city, state: row.state, items: JSON.parse(row.items_json) as OrderItem[], subtotal: Number(row.subtotal),
    shipping: Number(row.shipping), total: Number(row.total), paymentStatus: row.payment_status === "paid" ? "paid" : "pending",
    note: row.note, createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function updateOrderStatus(id: string, status: string) {
  if (!("new confirmed packed shipped delivered cancelled".split(" ")).includes(status)) throw new Error("Invalid order status");
  await ensureSchema();
  if (["confirmed", "packed", "shipped", "delivered"].includes(status)) {
    const [rows] = await database().query<(RowDataPacket & { payment_status: string })[]>("SELECT payment_status FROM orders WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) throw new Error("Order not found");
    if (rows[0].payment_status !== "paid") throw new Error("Confirm payment before moving this order forward");
  }
  await database().execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}

export async function confirmOrderPayment(id: string) {
  if (!id.startsWith("AQ-")) throw new Error("Invalid order id");
  await ensureSchema();
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<OrderRow[]>("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    const order = rows[0];
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") { await connection.commit(); return; }
    if (order.source === "website") {
      const items = JSON.parse(order.items_json) as OrderItem[];
      for (const item of items) {
        const productId = Number(item.id);
        const [inventoryRows] = await connection.query<(RowDataPacket & { stock: number })[]>("SELECT stock FROM inventory WHERE product_id = ? FOR UPDATE", [productId]);
        const stock = Number(inventoryRows[0]?.stock ?? 0);
        if (stock < item.qty) throw new Error(`${item.name} has only ${stock} unit(s) in stock`);
      }
      for (const item of items) {
        await connection.execute("UPDATE inventory SET stock = stock - ?, updated_at = ? WHERE product_id = ?", [item.qty, new Date(), Number(item.id)]);
      }
    }
    await connection.execute("UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function deleteOrder(id: string) {
  if (!id.startsWith("AQ-")) throw new Error("Invalid order id");
  await ensureSchema();
  await database().execute("DELETE FROM orders WHERE id = ?", [id]);
}
