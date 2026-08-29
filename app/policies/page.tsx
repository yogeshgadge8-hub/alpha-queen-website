import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping, Cancellation, Return & Refund Policy — Alpha Queen",
  description: "Alpha Queen order confirmation, shipping, cancellation, return and refund terms.",
};

export default function PoliciesPage() {
  return <main className="policy-page">
    <header className="policy-header"><a href="/" className="orders-logo">ALPHA QUEEN<span>cosmetics</span></a><a href="/">Back to store →</a></header>
    <section className="policy-shell">
      <div className="policy-intro"><span className="kicker">CUSTOMER POLICIES</span><h1>Clear terms before you order.</h1><p>These terms apply to orders placed on alphaqueenofficial.com. Please review them before confirming a prepaid order.</p></div>
      <div className="policy-grid">
        <article className="policy-card" id="payment"><span className="kicker">01 · PAYMENT</span><h2>Prepaid orders only</h2><ul><li>Cash on Delivery is not available.</li><li>The full product price, applicable tax and shipping charge are shown before payment.</li><li>An order is confirmed only after successful payment confirmation.</li></ul></article>
        <article className="policy-card" id="cancellation"><span className="kicker">02 · CANCELLATION</span><h2>Final after confirmation</h2><ul><li>You may request a correction or cancellation <strong>before</strong> the order is confirmed.</li><li>After confirmation, processing begins and the order cannot ordinarily be changed or cancelled.</li><li>A payment refund is not available for change of mind after confirmation.</li></ul></article>
        <article className="policy-card" id="returns"><span className="kicker">03 · RETURNS</span><h2>No change-of-mind returns</h2><ul><li>For hygiene and safety, cosmetics are not returnable for change of mind, shade/fragrance preference, or after opening/using the product.</li><li>Do not accept visibly damaged or tampered parcels where practical.</li><li>This policy does not limit remedies required by applicable consumer law.</li></ul></article>
        <article className="policy-card" id="exceptions"><span className="kicker">04 · EXCEPTIONS</span><h2>Damaged, defective or wrong item</h2><ul><li>Contact us promptly if the item is damaged, defective, spurious, materially different from its description, incorrect, or delivered outside the stated schedule (except force majeure).</li><li>Keep the product, label, outer packaging and order number. Photos or an unboxing video may help us resolve the claim faster.</li><li>After verification, we will provide replacement or refund as applicable.</li></ul></article>
        <article className="policy-card" id="shipping"><span className="kicker">05 · SHIPPING</span><h2>Delivery information</h2><ul><li>Shipping charges and the delivery estimate will be shown at checkout.</li><li>The customer is responsible for providing a complete name, mobile number, address and PIN code.</li><li>Courier delays caused by events outside reasonable control will be communicated where possible.</li></ul></article>
        <article className="policy-card" id="refunds"><span className="kicker">06 · APPROVED REFUNDS</span><h2>Refund processing</h2><ul><li>An approved refund is sent to the original payment method.</li><li>Bank or payment-provider processing time may apply after we initiate it.</li><li>Shipping charges are refundable only where required by law or when the fulfilment issue is attributable to us.</li></ul></article>
      </div>
      <div className="policy-contact"><b>Need order support?</b> Email <a href="mailto:care@alphaqueenofficial.com">care@alphaqueenofficial.com</a> with your order number and registered mobile number. Support hours: Mon–Sat, 10am–6pm IST.</div>
    </section>
  </main>;
}
