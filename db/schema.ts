import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2").notNull().default(""),
  landmark: text("landmark").notNull().default(""),
  pincode: text("pincode").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  itemsJson: text("items_json").notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull().default(0),
  total: integer("total").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull(),
});
