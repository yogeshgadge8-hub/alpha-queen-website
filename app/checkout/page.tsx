"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { catalogItems, products } from "@/lib/catalog";

type Address = { customerName: string; addressLine1: string; addressLine2: string; landmark: string; pincode: string; city: string; state: string };
const blankAddress: Address = { customerName: "", addressLine1: "", addressLine2: "", landmark: "", pincode: "", city: "", state: "Maharashtra" };

export default function CheckoutPage() {
  const [ids, setIds] = useState<number[]>([]);
  const [mobile, setMobile] = useState("");
  const [mobileReady, setMobileReady] = useState(false);
  const [address, setAddress] = useState<Address>(blankAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [stock, setStock] = useState<Record<number, number>>({});

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("items") ?? "";
    setIds(raw.split(",").map(Number).filter((id) => products.some((product) => product.id === id)));
    const loadStock = async () => { const response = await fetch("/api/catalog", { cache: "no-store" }); const data = await response.json() as { catalog?: { productId: number; stock: number }[] }; if (response.ok) setStock(Object.fromEntries((data.catalog ?? []).map((item) => [item.productId, item.stock]))); };
    void loadStock(); const timer = window.setInterval(() => void loadStock(), 30_000); return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(() => catalogItems(ids), [ids]);
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const shipping = subtotal >= 699 || subtotal === 0 ? 0 : 75;
  const total = subtotal + shipping;
  const cartCounts = ids.reduce<Record<number, number>>((counts, id) => ({ ...counts, [id]: (counts[id] ?? 0) + 1 }), {});
  const insufficientStock = Object.entries(cartCounts).some(([id, quantity]) => (stock[Number(id)] ?? 0) < quantity);

  const continueWithMobile = () => {
    const clean = mobile.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setMobile(clean); setError(""); setMobileReady(true);
  };

  const update = (key: keyof Address, value: string) => setAddress((current) => ({ ...current, [key]: value }));

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      if (insufficientStock) throw new Error("One or more products are out of stock or do not have enough quantity");
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        source: "website", mobile, ...address, shipping, paymentStatus: "pending",
        items: items.map((item) => ({ id: String(item.id), name: item.name, qty: 1, price: item.price })),
        note: "Payment gateway connection pending",
      }) });
      const data = await response.json() as { order?: { id: string }; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "Unable to create order");
      setOrderId(data.order.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create order"); }
    finally { setSubmitting(false); }
  };

  if (orderId) return <main className="checkout-page"><section className="checkout-success"><span>✓</span><small>ORDER SAVED</small><h1>Thank you.</h1><p>Your order number is <b>{orderId}</b>. Save it for future support.</p><div><a className="primary" href="/">Continue shopping</a></div><em>Payment gateway is not connected yet, so payment was not collected.</em></section></main>;

  return (
    <main className="checkout-page">
      <header className="checkout-header"><a href="/" className="logo">ALPHA QUEEN<span>cosmetics</span></a><div><b>Secure prepaid checkout</b><small>COD is not available</small></div></header>
      <section className="checkout-shell">
        <div className="checkout-flow">
          <div className="checkout-section"><span className="checkout-step">01</span><div className="checkout-section-head"><small>MOBILE LOGIN</small><h2>Continue with your mobile number</h2><p>OTP provider is not connected yet. Until activation, the number format is checked and used for the order record.</p></div><div className="mobile-entry"><span>+91</span><input aria-label="Mobile number" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={mobile} onChange={(event) => { setMobile(event.target.value.replace(/\D/g, "")); setMobileReady(false); }} /><button type="button" onClick={continueWithMobile}>{mobileReady ? "Number accepted ✓" : "Continue"}</button></div><div className="integration-note">OTP SMS provider not connected yet—no OTP is being sent.</div></div>

          {mobileReady && items.length > 0 && <form className="checkout-section" onSubmit={placeOrder}><span className="checkout-step">02</span><div className="checkout-section-head"><small>DELIVERY ADDRESS</small><h2>Where should we deliver?</h2><p>Fields marked * are required for courier booking and invoice details.</p></div><div className="address-grid"><label className="wide"><span>Full name *</span><input required value={address.customerName} onChange={(event) => update("customerName", event.target.value)} /></label><label className="wide"><span>Flat / house / building *</span><input required value={address.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} /></label><label className="wide"><span>Area / street *</span><input required value={address.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} /></label><label className="wide"><span>Landmark</span><input value={address.landmark} onChange={(event) => update("landmark", event.target.value)} /></label><label><span>PIN code *</span><input required inputMode="numeric" minLength={6} maxLength={6} value={address.pincode} onChange={(event) => update("pincode", event.target.value.replace(/\D/g, ""))} /></label><label><span>City *</span><input required value={address.city} onChange={(event) => update("city", event.target.value)} /></label><label><span>State *</span><input required value={address.state} onChange={(event) => update("state", event.target.value)} /></label></div>{insufficientStock && <p className="form-error">One or more products are out of stock or the requested quantity is unavailable.</p>}<label className="policy-check"><input type="checkbox" required checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} /><span>I agree that confirmed orders ordinarily cannot be cancelled and cosmetics have no change-of-mind return/refund. Damaged, defective or wrong products remain covered by the <a href="/policies" target="_blank">Return & Refund Policy</a>.</span></label>{error && <p className="form-error">{error}</p>}<button className="primary checkout-submit" disabled={submitting || !policyAccepted || insufficientStock}>{submitting ? "Saving order…" : insufficientStock ? "Stock unavailable" : "Save preview order →"}</button><small className="checkout-disclaimer">Payment gateway will be connected after final products and merchant account are ready.</small></form>}

          {mobileReady && items.length === 0 && <div className="checkout-section checkout-empty"><span className="checkout-step">02</span><h2>Your cart is empty</h2><p>Mobile number accepted for preview. Add a product before entering the delivery address.</p><a className="primary" href="/#shop">Shop products</a></div>}
          {error && !mobileReady && <p className="form-error">{error}</p>}
        </div>

        <aside className="order-summary"><small>ORDER SUMMARY</small><h2>{items.length} item{items.length === 1 ? "" : "s"}</h2>{items.length ? <>{items.map((item, index) => <div className="summary-item" key={`${item.id}-${index}`}><div className="summary-thumb">AQ</div><div><b>{item.name}</b><small>{item.size} · {(stock[item.id] ?? 0) > 0 ? `${stock[item.id]} available` : "Out of stock"}</small></div><strong>₹{item.price}</strong></div>)}<div className="summary-totals"><div><span>Subtotal</span><b>₹{subtotal}</b></div><div><span>Shipping</span><b>{shipping ? `₹${shipping}` : "FREE"}</b></div><div><span>Total</span><b>₹{total}</b></div></div></> : <p>No products in cart yet.</p>}<div className="summary-trust"><span>✓ Live stock check</span><span>✓ Prepaid orders only</span><span>✓ Order appears in admin desk</span></div></aside>
      </section>
    </main>
  );
}
