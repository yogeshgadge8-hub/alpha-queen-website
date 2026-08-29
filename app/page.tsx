"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { categories, products, type Product } from "@/lib/catalog";

type PublicReview = { id: number; customerName: string; rating: number; title: string; text: string; mediaUrl: string; createdAt: string };
type CatalogState = { productId: number; stock: number; lowStockThreshold: number; rating: number; reviewCount: number; reviews: PublicReview[]; media: { id: number; type: "image" | "video"; url: string; alt: string }[] };

function ProductVisual({ product, large = false, state }: { product: Product; large?: boolean; state?: CatalogState }) {
  const image = state?.media.find((media) => media.type === "image");
  if (image) return <div className={`product-visual product-photo ${large ? "product-visual--large" : ""}`}><img src={image.url} alt={image.alt || product.name} /></div>;
  return (
    <div className={`product-visual photo-pending ${large ? "product-visual--large" : ""}`} style={{ "--shade": product.shade, "--accent": product.accent } as React.CSSProperties}>
      <span className="photo-monogram">AQ</span>
      <div className="photo-copy"><b>{product.category}</b><small>Original product photo will be added here</small></div>
      <span className="photo-orbit photo-orbit--one" /><span className="photo-orbit photo-orbit--two" />
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<number[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [catalogState, setCatalogState] = useState<CatalogState[]>([]);
  const [review, setReview] = useState({ customerName: "", rating: "5", title: "", text: "", mediaUrl: "" });

  useEffect(() => {
    const loadCatalog = async () => { const response = await fetch("/api/catalog", { cache: "no-store" }); const data = await response.json() as { catalog?: CatalogState[] }; if (response.ok) setCatalogState(data.catalog ?? []); };
    void loadCatalog(); const timer = window.setInterval(() => void loadCatalog(), 30_000); return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category} ${product.subtitle} ${product.concern}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All" || product.category === category);
  }), [query, category]);

  const addToCart = (product: Product) => {
    const state = catalogState.find((item) => item.productId === product.id);
    const alreadyInCart = cart.filter((id) => id === product.id).length;
    if (!state || state.stock <= alreadyInCart) { setToast(state?.stock ? `Only ${state.stock} unit(s) available` : `${product.name} is out of stock`); setTimeout(() => setToast(""), 2200); return; }
    setCart((items) => [...items, product.id]);
    setToast(`${product.name} added to your bag`);
    setTimeout(() => setToast(""), 2200);
  };

  const cartProducts = cart.map((id) => products.find((item) => item.id === id)!).filter(Boolean);
  const cartTotal = cartProducts.reduce((sum, item) => sum + item.price, 0);

  const scrollToShop = (nextCategory = "All") => {
    setCategory(nextCategory);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return;
    const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: selected.id, ...review }) });
    const data = await response.json() as { error?: string; message?: string };
    setToast(response.ok ? data.message ?? "Review submitted for approval" : data.error ?? "Unable to submit review");
    if (response.ok) setReview({ customerName: "", rating: "5", title: "", text: "", mediaUrl: "" });
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <main>
      <div className="announcement"><span>PREPAID ORDERS ONLY</span><span>•</span><span>LAUNCH OFFER: QUEEN15</span><span>•</span><span>FREE SHIPPING ABOVE ₹699</span></div>
      <header className="header">
        <button className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Alpha Queen home">ALPHA QUEEN<span>cosmetics</span></button>
        <div className="search-wrap">
          <span>⌕</span>
          <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Alpha Queen products, ingredients or skin concern…" />
          {query && <button aria-label="Clear search" onClick={() => setQuery("")}>×</button>}
        </div>
        <nav className={menuOpen ? "nav nav--open" : "nav"}>
          <button onClick={() => scrollToShop("All")}>Shop all</button>
          <button onClick={() => scrollToShop("Body Wash")}>Bath & body</button>
          <button onClick={() => scrollToShop("Face Wash")}>Skin care</button>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
        </nav>
        <div className="header-actions">
          <button aria-label="Mobile account" onClick={() => { window.location.href = "/checkout"; }}><span>♙</span><small>Mobile login</small></button>
          <button aria-label="Wishlist"><span>♡</span><small>Wishlist</small>{liked.length > 0 && <i>{liked.length}</i>}</button>
          <button aria-label={`Shopping bag with ${cart.length} items`} onClick={() => setCartOpen(true)}><span>□</span><small>Bag</small>{cart.length > 0 && <i>{cart.length}</i>}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> ALPHA QUEEN COSMETICS</div>
          <h1>Everyday beauty,<br /><em>made for your glow.</em></h1>
          <p>Body wash, face wash, scrubs and daily skincare made for Indian routines. Explore the launch collection in one easy marketplace.</p>
          <div className="hero-buttons">
            <button className="primary" onClick={() => scrollToShop()}>Shop launch collection <span>→</span></button>
            <a href="#launch">View launch offers</a>
          </div>
          <div className="trust-row"><span>✓ Secure prepaid checkout</span><span>◎ Pan-India delivery plan</span><span>♻ Carefully packed</span></div>
        </div>
        <div className="hero-art" aria-label="Alpha Queen body wash product display">
          <div className="sun-disc" />
          <div className="hero-leaf hero-leaf--left" />
          <div className="hero-leaf hero-leaf--right" />
          <div className="stone stone--back" />
          <div className="stone stone--front" />
          <ProductVisual product={products[0]} state={catalogState.find((item) => item.productId === products[0].id)} large />
          <div className="hero-note"><b>01</b><span>Launch hero<br />body wash</span></div>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading"><div><span className="kicker">SHOP BY CATEGORY</span><h2>Everything for your beauty routine.</h2></div><button onClick={() => scrollToShop()}>View all products →</button></div>
        <div className="category-grid">
          {categories.map((item) => <button key={item.name} className="category-card" style={{ "--card": item.color } as React.CSSProperties} onClick={() => scrollToShop(item.name === "Gift Sets" ? "All" : item.name)}><span className="category-icon">{item.icon}</span><div><b>{item.name}</b><small>{item.note}</small></div><i>›</i></button>)}
        </div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading"><div><span className="kicker">ALPHA QUEEN STORE</span><h2>Today&apos;s beauty picks.</h2></div><div className="filters">{["All", "Body Wash", "Face Wash", "Body Scrub", "Moisturizer", "Serum"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
        {query && <p className="result-note">Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""} for “{query}”</p>}
        <div className="product-grid">
          {filtered.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image" onClick={() => setSelected(product)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(product)}>
                {product.badge && <span className="badge">{product.badge}</span>}
                <button className={`heart ${liked.includes(product.id) ? "heart--liked" : ""}`} aria-label={`Save ${product.name}`} onClick={(event) => { event.stopPropagation(); setLiked((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id]); }}>♥</button>
                <ProductVisual product={product} state={catalogState.find((item) => item.productId === product.id)} />
                <span className="quick-view">Quick view</span>
              </div>
              {(() => { const state = catalogState.find((item) => item.productId === product.id); const inStock = Boolean(state && state.stock > 0); return <div className="product-info"><div className="rating"><span>{state?.reviewCount ? "★★★★★" : "☆☆☆☆☆"}</span> {state?.reviewCount ? `${state.rating} (${state.reviewCount})` : "No reviews yet"}</div><small>{product.category} · {product.size}</small><h3>{product.name}</h3><p>{product.subtitle}</p><p className="concern">For {product.concern}</p><div className="price"><b>₹{product.price}</b>{product.oldPrice && <del>₹{product.oldPrice}</del>}<span>incl. taxes</span></div><em className={`stock-note ${!inStock ? "stock-note--out" : state && state.stock <= state.lowStockThreshold ? "stock-note--low" : ""}`}>{!state ? "Checking stock…" : !inStock ? "Out of stock" : state.stock <= state.lowStockThreshold ? `Only ${state.stock} remaining` : `In stock · ${state.stock} available`}</em><button disabled={!inStock} onClick={() => addToCart(product)}>{inStock ? "Add to cart" : "Unavailable"} <span>{inStock ? "＋" : "×"}</span></button></div>; })()}
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="empty-state"><span>○</span><h3>No products found</h3><p>Try a different search or explore our complete collection.</p><button className="primary" onClick={() => { setQuery(""); setCategory("All"); }}>See everything</button></div>}
      </section>

      <section className="promise" id="story">
        <div className="promise-art"><div className="arch"><ProductVisual product={products[3]} state={catalogState.find((item) => item.productId === products[3].id)} large /></div><span className="promise-seal">MADE WITH CARE<br />✦<br />FOR EVERY BODY</span></div>
        <div className="promise-copy"><span className="kicker">THE ALPHA QUEEN PROMISE</span><h2>Simple shopping.<br /><em>Confident beauty.</em></h2><p>One focused cosmetics destination with clear ingredients, sizes, prices and prepaid checkout. Final claims and product details will be added only after each formula is approved.</p><ul><li><span>01</span><div><b>Transparent product pages</b><small>Ingredients, usage and warnings presented clearly.</small></div></li><li><span>02</span><div><b>Secure prepaid orders</b><small>Payment confirmation and order tracking in one place.</small></div></li><li><span>03</span><div><b>Made for Indian customers</b><small>Mobile-first shopping and WhatsApp support planned.</small></div></li></ul><button className="text-button" onClick={() => scrollToShop()}>Explore products →</button></div>
      </section>

      <section className="reviews" id="help"><span className="kicker">SHOP WITH CONFIDENCE</span><h2>Everything you need, in one beautiful place.</h2><div className="review-grid"><blockquote><div>01</div><p>Search products by category, ingredient or skin concern.</p><footer><span>⌕</span><b>Smart discovery<small>Quick product search</small></b></footer></blockquote><blockquote><div>02</div><p>Add products to your cart and see the total instantly.</p><footer><span>＋</span><b>Easy shopping<small>Cart ready for checkout</small></b></footer></blockquote><blockquote><div>03</div><p>Order updates and customer support will connect at launch.</p><footer><span>✓</span><b>Order support<small>Tracking integration planned</small></b></footer></blockquote></div></section>

      <section className="newsletter"><span>ALPHA QUEEN LAUNCH LIST</span><h2>Be first to know.</h2><p>New products, launch dates and prepaid offers in your inbox.</p><form onSubmit={(e) => { e.preventDefault(); setToast("You are on the Alpha Queen launch list"); }}><input type="email" required aria-label="Email address" placeholder="Your email address" /><button>Notify me →</button></form></section>

      <footer><div><button className="logo logo--footer">ALPHA QUEEN<span>cosmetics</span></button><p>Your focused online destination for everyday cosmetics.</p><div className="socials"><button>ig</button><button>yt</button><button>f</button></div></div><div><b>SHOP</b><a href="#shop">Body wash</a><a href="#shop">Body scrub</a><a href="#shop">Face care</a><a href="#shop">Gift sets</a></div><div><b>HELP</b><a href="mailto:care@alphaqueenofficial.com">Contact us</a><a href="/policies#shipping">Shipping policy</a><a href="/policies#returns">Return policy</a><a href="/policies#cancellation">Cancellation policy</a></div><div><b>ABOUT</b><a href="#story">Our story</a><a href="#story">Ingredients</a><a href="#story">Why Alpha Queen</a><a href="/admin/orders">Order desk</a></div><div className="footer-contact"><b>NEED HELP?</b><p>Mon–Sat, 10am–6pm IST</p><a href="mailto:care@alphaqueenofficial.com">care@alphaqueenofficial.com</a></div></footer>
      <div className="legal"><span>© 2026 Alpha Queen. Preview storefront.</span><span><a href="/policies">Terms · Shipping · Returns</a></span><span>alphaqueenofficial.com</span></div>

      {toast && <div className="toast">✓ {toast}</div>}
      {cartOpen && <><button className="overlay" aria-label="Close cart" onClick={() => setCartOpen(false)} /><aside className="cart-drawer"><div className="drawer-head"><div><small>YOUR CART</small><h2>Shopping cart ({cart.length})</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>{cartProducts.length === 0 ? <div className="cart-empty"><span>□</span><h3>Your cart is empty</h3><p>Explore Alpha Queen&apos;s launch collection.</p><button className="primary" onClick={() => { setCartOpen(false); scrollToShop(); }}>Start shopping</button></div> : <><div className="cart-items">{cartProducts.map((product, index) => <div className="cart-item" key={`${product.id}-${index}`}><ProductVisual product={product} /><div><small>{product.category} · {product.size}</small><b>{product.name}</b><p>₹{product.price}</p><button onClick={() => setCart((items) => items.filter((_, i) => i !== index))}>Remove</button></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><b>₹{cartTotal}</b></div><small>Prepaid orders only. Shipping will be calculated at checkout.</small><button onClick={() => { window.location.href = `/checkout?items=${cart.join(",")}`; }}>Continue with mobile number →</button></div></>}</aside></>}
      {selected && (() => { const state = catalogState.find((item) => item.productId === selected.id); const inStock = Boolean(state && state.stock > 0); return <><button className="overlay" aria-label="Close product view" onClick={() => setSelected(null)} /><div className="modal product-modal"><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="product-media-column"><ProductVisual product={selected} state={state} large />{state?.media.filter((media) => media.type === "video").map((media) => <video key={media.id} controls preload="metadata" src={media.url} />)}</div><div className="modal-info"><span className="kicker">{selected.category}</span><h2>{selected.name}</h2><div className="rating"><span>{state?.reviewCount ? "★★★★★" : "☆☆☆☆☆"}</span> {state?.reviewCount ? `${state.rating} (${state.reviewCount})` : "No approved reviews yet"}</div><p>A launch-preview formula featuring {selected.subtitle.toLowerCase()}, designed for {selected.concern.toLowerCase()}. Final ingredients, directions and claims will be confirmed before sale.</p><ul><li>{selected.size} pack</li><li>Prepaid online order</li><li>{!state ? "Checking stock" : !inStock ? "Out of stock" : state.stock <= state.lowStockThreshold ? `Only ${state.stock} remaining` : `${state.stock} available`}</li></ul><div className="modal-price"><b>₹{selected.price}</b><small>{selected.size} · Inclusive of all taxes</small></div><button className="primary" disabled={!inStock} onClick={() => { addToCart(selected); if (inStock) setSelected(null); }}>{inStock ? "Add to cart →" : "Out of stock"}</button><div className="approved-reviews"><h3>Customer reviews</h3>{state?.reviews.length ? state.reviews.map((item) => <article key={item.id}><b>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)} {item.title}</b><p>{item.text}</p><small>{item.customerName}</small>{item.mediaUrl && <a href={item.mediaUrl} target="_blank" rel="noreferrer">View photo/video</a>}</article>) : <p>No approved customer reviews yet.</p>}</div><form className="review-form" onSubmit={submitReview}><h3>Write a review</h3><div><input required placeholder="Your name" value={review.customerName} onChange={(event) => setReview((current) => ({ ...current, customerName: event.target.value }))} /><select value={review.rating} onChange={(event) => setReview((current) => ({ ...current, rating: event.target.value }))}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div><input placeholder="Review title" value={review.title} onChange={(event) => setReview((current) => ({ ...current, title: event.target.value }))} /><textarea required minLength={10} placeholder="Share your experience" value={review.text} onChange={(event) => setReview((current) => ({ ...current, text: event.target.value }))} /><input type="url" placeholder="Optional photo/video URL" value={review.mediaUrl} onChange={(event) => setReview((current) => ({ ...current, mediaUrl: event.target.value }))} /><button>Submit for approval</button></form></div></div></>; })()}
    </main>
  );
}
