import type { RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";

export type AnalyticsSettings = {
  gstRate: number;
  packagingPerOrder: number;
  courierPerOrder: number;
  gatewayRate: number;
  gatewayGstRate: number;
  adsPerOrder: number;
  softwarePerOrder: number;
  otherPerOrder: number;
};

type SettingsRow = RowDataPacket & {
  gst_rate: number; packaging_per_order: number; courier_per_order: number; gateway_rate: number;
  gateway_gst_rate: number; ads_per_order: number; software_per_order: number; other_per_order: number;
};
type OrderRow = RowDataPacket & { id: string; total: number; payment_status: string; status: string; items_json: string; created_at: Date };
type ProductRow = RowDataPacket & { id: number; name: string; price: number; purchase_cost: number; stock: number; low_stock_threshold: number; active: number };

const mapSettings = (row: SettingsRow): AnalyticsSettings => ({
  gstRate: Number(row.gst_rate), packagingPerOrder: Number(row.packaging_per_order), courierPerOrder: Number(row.courier_per_order),
  gatewayRate: Number(row.gateway_rate), gatewayGstRate: Number(row.gateway_gst_rate), adsPerOrder: Number(row.ads_per_order),
  softwarePerOrder: Number(row.software_per_order), otherPerOrder: Number(row.other_per_order),
});

async function readSettings() {
  const [rows] = await database().query<SettingsRow[]>("SELECT * FROM analytics_settings WHERE id = 1 LIMIT 1");
  if (!rows[0]) throw new Error("Analytics settings are not configured");
  return mapSettings(rows[0]);
}

const safeNumber = (value: unknown, max: number) => {
  const number = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(number) || number < 0 || number > max) throw new Error("Enter valid analytics costs");
  return number;
};

export async function updateAnalyticsSettings(value: unknown) {
  await ensureSchema();
  const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const settings: AnalyticsSettings = {
    gstRate: safeNumber(body.gstRate, 100), packagingPerOrder: safeNumber(body.packagingPerOrder, 1_000_000),
    courierPerOrder: safeNumber(body.courierPerOrder, 1_000_000), gatewayRate: safeNumber(body.gatewayRate, 100),
    gatewayGstRate: safeNumber(body.gatewayGstRate, 100), adsPerOrder: safeNumber(body.adsPerOrder, 1_000_000),
    softwarePerOrder: safeNumber(body.softwarePerOrder, 1_000_000), otherPerOrder: safeNumber(body.otherPerOrder, 1_000_000),
  };
  await database().execute(`UPDATE analytics_settings SET gst_rate=?, packaging_per_order=?, courier_per_order=?, gateway_rate=?,
    gateway_gst_rate=?, ads_per_order=?, software_per_order=?, other_per_order=?, updated_at=? WHERE id=1`,
    [settings.gstRate, settings.packagingPerOrder, settings.courierPerOrder, settings.gatewayRate, settings.gatewayGstRate,
      settings.adsPerOrder, settings.softwarePerOrder, settings.otherPerOrder, new Date()]);
  return settings;
}

export async function analyticsSnapshot() {
  await ensureSchema();
  const [settings, orderResult, productResult] = await Promise.all([
    readSettings(),
    database().query<OrderRow[]>("SELECT id, total, payment_status, status, items_json, created_at FROM orders ORDER BY created_at DESC"),
    database().query<ProductRow[]>(`SELECT p.id, p.name, p.price, p.purchase_cost, COALESCE(i.stock,0) AS stock,
      COALESCE(i.low_stock_threshold,5) AS low_stock_threshold, p.active FROM store_products p LEFT JOIN inventory i ON i.product_id=p.id ORDER BY p.id`),
  ]);
  const orders = orderResult[0];
  const products = productResult[0];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paid = orders.filter((order) => order.payment_status === "paid" && order.status !== "cancelled");
  const monthOrders = orders.filter((order) => new Date(order.created_at) >= monthStart && order.status !== "cancelled");
  const monthPaid = paid.filter((order) => new Date(order.created_at) >= monthStart);
  const productById = new Map(products.map((product) => [String(product.id), product]));
  const productByName = new Map(products.map((product) => [product.name.trim().toLowerCase(), product]));
  const orderProfit = (order: OrderRow) => {
    const items = JSON.parse(order.items_json) as Array<{ id?: string; name?: string; qty?: number }>;
    let missingCost = false;
    const productCost = items.reduce((sum, item) => {
      const product = productById.get(String(item.id ?? "")) ?? productByName.get(String(item.name ?? "").trim().toLowerCase());
      if (!product || Number(product.purchase_cost) <= 0) missingCost = true;
      return sum + Number(product?.purchase_cost ?? 0) * Math.max(1, Number(item.qty) || 1);
    }, 0);
    const total = Number(order.total);
    const revenueBeforeGst = total / (1 + settings.gstRate / 100);
    const gateway = total * settings.gatewayRate / 100 * (1 + settings.gatewayGstRate / 100);
    const fixed = settings.packagingPerOrder + settings.courierPerOrder + settings.adsPerOrder + settings.softwarePerOrder + settings.otherPerOrder;
    return { profit: revenueBeforeGst - productCost - gateway - fixed, productCost, missingCost };
  };
  const summarize = (list: OrderRow[]) => list.reduce((summary, order) => {
    const result = orderProfit(order);
    return { revenue: summary.revenue + Number(order.total), netProfit: summary.netProfit + result.profit,
      productCost: summary.productCost + result.productCost, missingCostOrders: summary.missingCostOrders + (result.missingCost ? 1 : 0) };
  }, { revenue: 0, netProfit: 0, productCost: 0, missingCostOrders: 0 });
  const lifetime = summarize(paid);
  const month = summarize(monthPaid);
  const availableStock = products.reduce((sum, product) => sum + Number(product.stock), 0);
  const inventoryCostValue = products.reduce((sum, product) => sum + Number(product.stock) * Number(product.purchase_cost), 0);
  return {
    generatedAt: new Date().toISOString(), settings,
    totals: { totalOrders: orders.length, paidOrders: paid.length, pendingOrders: orders.filter((order) => order.payment_status === "pending" && order.status !== "cancelled").length,
      lifetimeRevenue: lifetime.revenue, lifetimeNetProfit: lifetime.netProfit, monthOrders: monthOrders.length, monthPaidOrders: monthPaid.length,
      monthRevenue: month.revenue, monthNetProfit: month.netProfit, availableStock, inventoryCostValue, missingCostOrders: month.missingCostOrders },
    products: products.map((product) => ({ id: Number(product.id), name: product.name, sellingPrice: Number(product.price), purchaseCost: Number(product.purchase_cost),
      stock: Number(product.stock), lowStockThreshold: Number(product.low_stock_threshold), active: Boolean(product.active), stockValue: Number(product.stock) * Number(product.purchase_cost) })),
    integrations: {
      smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM),
      emailOtp: Boolean(process.env.SMTP_HOST && process.env.EMAIL_OTP_SECRET),
      paymentGateway: Boolean(process.env.PAYMENT_GATEWAY_PROVIDER && process.env.PAYMENT_GATEWAY_KEY_ID && process.env.PAYMENT_GATEWAY_SECRET),
      paymentProvider: process.env.PAYMENT_GATEWAY_PROVIDER || "Not configured",
    },
  };
}
