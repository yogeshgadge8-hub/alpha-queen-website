"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
  id: string; source: "website" | "instagram" | "whatsapp"; status: string; customerName: string; mobile: string;
  addressLine1: string; addressLine2: string; landmark: string; pincode: string; city: string; state: string;
  items: OrderItem[]; subtotal: number; shipping: number; total: number; paymentStatus: "pending" | "paid"; note: string; createdAt: string;
};

const initialForm = { source: "whatsapp", customerName: "", mobile: "", addressLine1: "", addressLine2: "", landmark: "", pincode: "", city: "", state: "Maharashtra", product: "", quantity: "1", amount: "", shipping: "0", paymentStatus: "pending", note: "" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    try { const response = await fetch("/api/orders", { cache: "no-store" }); const data = await response.json() as { orders?: Order[]; error?: string }; if (!response.ok) throw new Error(data.error); setOrders(data.orders ?? []); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load orders"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadOrders(); }, [loadOrders]);
  const visibleOrders = useMemo(() => filter === "all" ? orders : orders.filter((order) => order.source === filter), [orders, filter]);
  const update = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const addSocialOrder = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        source: form.source, customerName: form.customerName, mobile: form.mobile, addressLine1: form.addressLine1,
        addressLine2: form.addressLine2, landmark: form.landmark, pincode: form.pincode, city: form.city, state: form.state,
        items: [{ id: "social-order", name: form.product, qty: Number(form.quantity), price: Number(form.amount) }],
        shipping: Number(form.shipping), paymentStatus: form.paymentStatus, note: form.note,
      }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to save order");
      setForm(initialForm); await loadOrders();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save order"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    const response = await fetch("/api/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  };

  return (
    <main className="orders-page">
      <header className="orders-header"><div><a href="/" className="orders-logo">ALPHA QUEEN<span>order desk</span></a><p>Website, Instagram आणि WhatsApp orders एकाच ठिकाणी.</p></div><div><a href="/profit-calculator">Profit calculator</a><a href="/">View store</a></div></header>
      <section className="orders-alert"><b>ADMIN ORDER DESK</b><span>Website orders इथे automatically दिसतील. WhatsApp/Instagram automatic import अजून जोडलेले नाही; social orders खाली manually add करा.</span></section>
      <section className="orders-shell">
        <form className="social-order-form no-print" onSubmit={addSocialOrder}><div className="orders-title"><small>ADD SOCIAL ORDER</small><h1>Instagram / WhatsApp order</h1><p>Chatमध्ये आलेली customer माहिती इथे भरा; order listमध्ये save होईल.</p></div><div className="order-form-grid"><label><span>Order source *</span><select value={form.source} onChange={(event) => update("source", event.target.value)}><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option></select></label><label><span>Full name *</span><input required value={form.customerName} onChange={(event) => update("customerName", event.target.value)} /></label><label><span>Mobile number *</span><input required inputMode="numeric" maxLength={10} value={form.mobile} onChange={(event) => update("mobile", event.target.value.replace(/\D/g, ""))} /></label><label className="wide"><span>Flat / house / building *</span><input required value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} /></label><label className="wide"><span>Area / street *</span><input required value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} /></label><label className="wide"><span>Landmark</span><input value={form.landmark} onChange={(event) => update("landmark", event.target.value)} /></label><label><span>PIN code *</span><input required inputMode="numeric" maxLength={6} value={form.pincode} onChange={(event) => update("pincode", event.target.value.replace(/\D/g, ""))} /></label><label><span>City *</span><input required value={form.city} onChange={(event) => update("city", event.target.value)} /></label><label><span>State *</span><input required value={form.state} onChange={(event) => update("state", event.target.value)} /></label><label className="wide"><span>Product / variant *</span><input required placeholder="Example: Body Wash 250 ml" value={form.product} onChange={(event) => update("product", event.target.value)} /></label><label><span>Quantity *</span><input required type="number" min="1" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} /></label><label><span>Unit price ₹ *</span><input required type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label><label><span>Shipping ₹</span><input type="number" min="0" value={form.shipping} onChange={(event) => update("shipping", event.target.value)} /></label><label><span>Payment</span><select value={form.paymentStatus} onChange={(event) => update("paymentStatus", event.target.value)}><option value="pending">Pending</option><option value="paid">Paid</option></select></label><label className="wide"><span>Internal note</span><textarea rows={3} value={form.note} onChange={(event) => update("note", event.target.value)} /></label></div>{error && <p className="form-error">{error}</p>}<button className="primary" disabled={saving}>{saving ? "Saving…" : "Add order →"}</button></form>

        <section className="orders-list"><div className="orders-toolbar no-print"><div><small>ALL CHANNELS</small><h2>Order list</h2><p>{visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"}</p></div><div className="order-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button><button className={filter === "website" ? "active" : ""} onClick={() => setFilter("website")}>Website</button><button className={filter === "whatsapp" ? "active" : ""} onClick={() => setFilter("whatsapp")}>WhatsApp</button><button className={filter === "instagram" ? "active" : ""} onClick={() => setFilter("instagram")}>Instagram</button><button className="print-button" onClick={() => window.print()}>Print order list</button></div></div>
          {loading ? <div className="orders-empty">Loading orders…</div> : visibleOrders.length === 0 ? <div className="orders-empty"><b>No orders yet</b><span>Add a WhatsApp/Instagram order or place a website preview order.</span></div> : <div className="order-cards">{visibleOrders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><small>{new Date(order.createdAt).toLocaleString("en-IN")}</small><h3>{order.id}</h3></div><span className={`source source--${order.source}`}>{order.source}</span></div><div className="order-customer"><div><small>CUSTOMER</small><b>{order.customerName}</b><a href={`tel:+91${order.mobile}`}>+91 {order.mobile}</a></div><div><small>DELIVERY ADDRESS</small><p>{order.addressLine1}, {order.addressLine2}{order.landmark ? `, ${order.landmark}` : ""}<br />{order.city}, {order.state} — {order.pincode}</p></div></div><div className="order-items">{order.items.map((item, index) => <div key={`${item.id}-${index}`}><span>{item.qty} × {item.name}</span><b>₹{item.qty * item.price}</b></div>)}<div><span>Shipping</span><b>{order.shipping ? `₹${order.shipping}` : "FREE"}</b></div><div className="order-total"><span>Total</span><b>₹{order.total}</b></div></div><div className="order-card-foot"><span className={order.paymentStatus === "paid" ? "paid" : "pending"}>{order.paymentStatus}</span><label className="no-print"><small>STATUS</small><select value={order.status} onChange={(event) => void changeStatus(order.id, event.target.value)}>{["new", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((status) => <option value={status} key={status}>{status}</option>)}</select></label></div>{order.note && <p className="order-note">Note: {order.note}</p>}</article>)}</div>}
        </section>
      </section>
    </main>
  );
}
