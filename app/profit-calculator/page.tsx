"use client";

import { useEffect, useMemo, useState } from "react";

type CalculatorProduct = { id: string; name: string; price: number; sampleCost: number; active?: boolean };

const sampleCosts: Record<string, number> = {
  "Royal Oat Body Wash": 165,
  "Vitamin Glow Face Wash": 135,
  "Coffee Polish Body Scrub": 185,
  "Aqua Calm Body Wash": 155,
  "Berry Bright Face Wash": 145,
  "Sandal Smooth Scrub": 205,
};

const fallbackCatalog: CalculatorProduct[] = [
  { id: "sample-1", name: "Royal Oat Body Wash", price: 399, sampleCost: 165 },
  { id: "sample-2", name: "Vitamin Glow Face Wash", price: 299, sampleCost: 135 },
  { id: "sample-3", name: "Coffee Polish Body Scrub", price: 449, sampleCost: 185 },
  { id: "sample-4", name: "Aqua Calm Body Wash", price: 379, sampleCost: 155 },
  { id: "sample-5", name: "Berry Bright Face Wash", price: 329, sampleCost: 145 },
  { id: "sample-6", name: "Sandal Smooth Scrub", price: 499, sampleCost: 205 },
];

type Inputs = {
  sellingPrice: number;
  discount: number;
  shippingCharged: number;
  gstRate: number;
  productCost: number;
  packaging: number;
  courierCost: number;
  gatewayRate: number;
  gatewayGst: number;
  adsCost: number;
  agentCost: number;
  otherCost: number;
  platformRate: number;
  inputTaxCredit: number;
  monthlyOrders: number;
};

const initialInputs: Inputs = {
  sellingPrice: 499,
  discount: 0,
  shippingCharged: 0,
  gstRate: 18,
  productCost: 165,
  packaging: 25,
  courierCost: 75,
  gatewayRate: 2,
  gatewayGst: 18,
  adsCost: 40,
  agentCost: 5,
  otherCost: 10,
  platformRate: 0,
  inputTaxCredit: 0,
  monthlyOrders: 100,
};

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);

const percent = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

function NumberField({ label, value, onChange, suffix = "₹", hint }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; hint?: string }) {
  return (
    <label className="calc-field">
      <span>{label}</span>
      <div><i>{suffix}</i><input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} /></div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function ProfitCalculator() {
  const [catalog, setCatalog] = useState<CalculatorProduct[]>(fallbackCatalog);
  const [productId, setProductId] = useState(fallbackCatalog[0].id);
  const [manualProductName, setManualProductName] = useState("");
  const [catalogMessage, setCatalogMessage] = useState("Loading products from admin catalog…");
  const [inputs, setInputs] = useState<Inputs>(initialInputs);

  const update = (key: keyof Inputs, value: number) => setInputs((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        let response = await fetch("/api/catalog?admin=1", { cache: "no-store" });
        let includesInactive = true;
        if (response.status === 401) {
          response = await fetch("/api/catalog", { cache: "no-store" });
          includesInactive = false;
        }
        const data = await response.json() as { products?: Array<{ id: number; name: string; price: number; active?: boolean }>; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load products");
        const products = (data.products ?? []).map((product) => ({
          id: String(product.id),
          name: product.name,
          price: Number(product.price),
          sampleCost: sampleCosts[product.name] ?? 0,
          active: product.active,
        }));
        if (!products.length) throw new Error("No catalog products found");
        setCatalog(products);
        setProductId(products[0].id);
        setInputs((current) => ({ ...current, sellingPrice: products[0].price, productCost: products[0].sampleCost }));
        setCatalogMessage(includesInactive ? `${products.length} admin products loaded, including inactive drafts.` : `${products.length} live products loaded. Sign in as admin to include inactive drafts.`);
      } catch (error) {
        setCatalogMessage(`${error instanceof Error ? error.message : "Unable to load products"}. Sample products are shown; Manual product is still available.`);
      }
    };
    void loadCatalog();
  }, []);

  const selectProduct = (id: string) => {
    setProductId(id);
    if (id === "manual") return;
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    setInputs((current) => ({ ...current, sellingPrice: product.price, productCost: product.sampleCost }));
  };

  const reset = () => {
    const first = catalog[0];
    setProductId(first?.id ?? "manual");
    setManualProductName("");
    setInputs({ ...initialInputs, sellingPrice: first?.price ?? initialInputs.sellingPrice, productCost: first?.sampleCost ?? 0 });
  };

  const result = useMemo(() => {
    const discountedPrice = Math.max(inputs.sellingPrice - inputs.discount, 0);
    const customerPays = discountedPrice + inputs.shippingCharged;
    const gstCollected = customerPays * inputs.gstRate / (100 + inputs.gstRate);
    const revenueBeforeGst = customerPays - gstCollected;
    const gatewayFee = customerPays * inputs.gatewayRate / 100;
    const gatewayFeeGst = gatewayFee * inputs.gatewayGst / 100;
    const platformFee = customerPays * inputs.platformRate / 100;
    const fixedCosts = inputs.productCost + inputs.packaging + inputs.courierCost + inputs.adsCost + inputs.agentCost + inputs.otherCost;
    const totalCosts = fixedCosts + gatewayFee + gatewayFeeGst + platformFee;
    const gstPayable = Math.max(gstCollected - inputs.inputTaxCredit, 0);
    const profit = revenueBeforeGst - totalCosts + inputs.inputTaxCredit;
    const margin = customerPays > 0 ? profit / customerPays * 100 : 0;
    const costAfterCredit = Math.max(totalCosts - inputs.inputTaxCredit, 0);
    const roi = costAfterCredit > 0 ? profit / costAfterCredit * 100 : 0;
    const variableRate = (inputs.gatewayRate / 100) * (1 + inputs.gatewayGst / 100) + inputs.platformRate / 100;
    const netRevenueFactor = 1 / (1 + inputs.gstRate / 100) - variableRate;
    const breakEvenCollected = netRevenueFactor > 0 ? Math.max(fixedCosts - inputs.inputTaxCredit, 0) / netRevenueFactor : 0;
    const breakEvenPrice = Math.max(breakEvenCollected - inputs.shippingCharged + inputs.discount, 0);
    return { discountedPrice, customerPays, gstCollected, revenueBeforeGst, gatewayFee, gatewayFeeGst, platformFee, totalCosts, gstPayable, profit, margin, roi, breakEvenPrice, monthlyProfit: profit * inputs.monthlyOrders };
  }, [inputs]);

  const maxBar = Math.max(result.customerPays, result.totalCosts, 1);
  const barWidth = (value: number) => `${Math.min(Math.max(value / maxBar * 100, 0), 100)}%`;

  return (
    <main className="calculator-page">
      <header className="calculator-header">
        <a href="/" className="calculator-brand">ALPHA QUEEN<span>seller tools</span></a>
        <div><span className="calc-private">PRIVATE COSTING TOOL</span><a href="/">← Back to store</a></div>
      </header>

      <section className="calculator-intro">
        <div><span className="kicker">UNIT ECONOMICS</span><h1>Know what you <em>really earn.</em></h1><p>प्रत्येक orderचा स्पष्ट हिशोब—GST, shipping, payment fee आणि प्रत्येक छोटा खर्च वजा केल्यानंतर उरणारा वास्तविक profit.</p></div>
        <div className="formula-card"><small>CORE FORMULA</small><b>Net revenue − total selling costs + eligible ITC</b><p>MRP minus product cost म्हणजे profit नाही. Courier, packaging, gateway, advertising आणि tax सर्व धरले आहेत.</p></div>
      </section>

      <section className="calculator-shell">
        <div className="calculator-inputs">
          <div className="calc-panel-head"><div><span>01</span><h2>Product & selling price</h2></div><button onClick={reset}>Reset sample</button></div>
          <label className="product-picker"><span>Alpha Queen product</span><select value={productId} onChange={(event) => selectProduct(event.target.value)}>{catalog.map((product) => <option value={product.id} key={product.id}>{product.name} — ₹{product.price}{product.active === false ? " (inactive draft)" : ""}</option>)}<option value="manual">＋ Manual product / custom calculation</option></select>{productId === "manual" && <input className="manual-product-name" value={manualProductName} onChange={(event) => setManualProductName(event.target.value)} placeholder="Enter product name, variant or combo" />}<small>{catalogMessage} Purchase cost invoiceनुसार खाली manually भरा.</small></label>
          <div className="calc-grid calc-grid--three">
            <NumberField label="MRP / selling price" value={inputs.sellingPrice} onChange={(value) => update("sellingPrice", value)} hint="GST inclusive" />
            <NumberField label="Discount" value={inputs.discount} onChange={(value) => update("discount", value)} hint="Coupon/offer per order" />
            <NumberField label="Shipping charged" value={inputs.shippingCharged} onChange={(value) => update("shippingCharged", value)} hint="0 means free shipping" />
          </div>

          <div className="calc-divider" />
          <div className="calc-panel-head"><div><span>02</span><h2>Product & delivery costs</h2></div></div>
          <div className="calc-grid calc-grid--three">
            <NumberField label="Purchase price / product cost" value={inputs.productCost} onChange={(value) => update("productCost", value)} hint="Supplier purchase price + inward freight per unit" />
            <NumberField label="Packaging cost" value={inputs.packaging} onChange={(value) => update("packaging", value)} hint="Bottle wrap, box, label" />
            <NumberField label="Actual courier cost" value={inputs.courierCost} onChange={(value) => update("courierCost", value)} hint="What courier charges you" />
            <NumberField label="Advertising/order" value={inputs.adsCost} onChange={(value) => update("adsCost", value)} hint="Ad spend ÷ paid orders" />
            <NumberField label="Agent & software/order" value={inputs.agentCost} onChange={(value) => update("agentCost", value)} hint="AI, messages, hosting share" />
            <NumberField label="Other cost/order" value={inputs.otherCost} onChange={(value) => update("otherCost", value)} hint="Handling, samples, leakage" />
          </div>

          <div className="calc-divider" />
          <div className="calc-panel-head"><div><span>03</span><h2>Tax & payment charges</h2></div></div>
          <div className="calc-grid calc-grid--three">
            <NumberField label="Product GST rate" value={inputs.gstRate} onChange={(value) => update("gstRate", value)} suffix="%" hint="Default 18%; verify HSN" />
            <NumberField label="Payment gateway" value={inputs.gatewayRate} onChange={(value) => update("gatewayRate", value)} suffix="%" hint="Provider's transaction rate" />
            <NumberField label="GST on gateway fee" value={inputs.gatewayGst} onChange={(value) => update("gatewayGst", value)} suffix="%" hint="Default 18%" />
            <NumberField label="Platform commission" value={inputs.platformRate} onChange={(value) => update("platformRate", value)} suffix="%" hint="Own site = 0%" />
            <NumberField label="Eligible Input GST Credit" value={inputs.inputTaxCredit} onChange={(value) => update("inputTaxCredit", value)} hint="Per order, valid invoices only" />
            <NumberField label="Expected monthly orders" value={inputs.monthlyOrders} onChange={(value) => update("monthlyOrders", value)} suffix="№" hint="For monthly projection" />
          </div>
        </div>

        <aside className="calculator-results">
          <div className={`profit-hero ${result.profit < 0 ? "profit-hero--loss" : ""}`}><small>NET PROFIT / ORDER</small><strong>{money(result.profit)}</strong><span>{result.profit >= 0 ? "After GST and every entered cost" : "Loss at the current selling price"}</span></div>
          <div className="metric-grid"><div><small>Profit margin</small><b>{percent(result.margin)}</b></div><div><small>Return on cost</small><b>{percent(result.roi)}</b></div><div><small>Break-even MRP</small><b>{money(result.breakEvenPrice)}</b></div><div><small>Monthly profit</small><b>{money(result.monthlyProfit)}</b></div></div>

          <div className="calculation-slip">
            <h3>Per-order breakdown</h3>
            <div><span>Product after discount</span><b>{money(result.discountedPrice)}</b></div>
            <div><span>Shipping collected</span><b>+ {money(inputs.shippingCharged)}</b></div>
            <div className="slip-total"><span>Customer pays</span><b>{money(result.customerPays)}</b></div>
            <div><span>GST included ({inputs.gstRate}%)</span><b>− {money(result.gstCollected)}</b></div>
            <div><span>Revenue before GST</span><b>{money(result.revenueBeforeGst)}</b></div>
            <div><span>Purchase price + packing + courier</span><b>− {money(inputs.productCost + inputs.packaging + inputs.courierCost)}</b></div>
            <div><span>Gateway fee + GST</span><b>− {money(result.gatewayFee + result.gatewayFeeGst)}</b></div>
            {result.platformFee > 0 && <div><span>Platform commission</span><b>− {money(result.platformFee)}</b></div>}
            <div><span>Ads + agent + other</span><b>− {money(inputs.adsCost + inputs.agentCost + inputs.otherCost)}</b></div>
            <div><span>Eligible Input GST Credit</span><b className="positive">+ {money(inputs.inputTaxCredit)}</b></div>
            <div className="slip-profit"><span>Final profit</span><b>{money(result.profit)}</b></div>
          </div>

          <div className="cost-bars"><h3>Money flow</h3><div><label><span>Customer collection</span><b>{money(result.customerPays)}</b></label><i><em style={{ width: barWidth(result.customerPays) }} /></i></div><div><label><span>Total costs</span><b>{money(result.totalCosts)}</b></label><i><em className="cost-bar" style={{ width: barWidth(result.totalCosts) }} /></i></div><div><label><span>Estimated GST payable</span><b>{money(result.gstPayable)}</b></label><i><em className="tax-bar" style={{ width: barWidth(result.gstPayable) }} /></i></div></div>
        </aside>
      </section>

      <section className="calc-notes"><div><b>GST calculation</b><p>Inclusive GST = Customer collection × GST rate ÷ (100 + GST rate). 18% is prefilled for planning, not a final tax classification.</p></div><div><b>Input Tax Credit</b><p>Only enter credit that your accountant confirms is eligible and supported by valid tax invoices. Otherwise keep it ₹0.</p></div><div><b>Shipping clarity</b><p>“Shipping charged” is what the customer pays. “Courier cost” is what you pay—these are deliberately separate.</p></div></section>
      <footer className="calculator-footer"><span>Alpha Queen Seller Tools · Estimate only</span><span>Confirm HSN, GST and eligible ITC with a tax professional before filing.</span></footer>
    </main>
  );
}
