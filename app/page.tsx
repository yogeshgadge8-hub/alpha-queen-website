"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  subtitle: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  shade: string;
  accent: string;
  form: "pump" | "tube" | "jar";
  badge?: string;
};

const products: Product[] = [
  { id: 1, name: "Moonmilk Body Wash", category: "Body Wash", subtitle: "Oat milk + ceramides", price: 499, oldPrice: 599, rating: 4.8, reviews: 214, shade: "#e8ddd1", accent: "#7b4b38", form: "pump", badge: "Bestseller" },
  { id: 2, name: "Citrus Dew Face Wash", category: "Face Wash", subtitle: "Vitamin C + green tea", price: 399, oldPrice: 449, rating: 4.7, reviews: 182, shade: "#dfe8c5", accent: "#5e6b37", form: "tube", badge: "New" },
  { id: 3, name: "Cocoa Cloud Scrub", category: "Body Scrub", subtitle: "Coffee + cocoa butter", price: 549, oldPrice: 649, rating: 4.9, reviews: 308, shade: "#c99370", accent: "#63351f", form: "jar", badge: "Most loved" },
  { id: 4, name: "Rainwater Body Wash", category: "Body Wash", subtitle: "Aloe + sea minerals", price: 479, rating: 4.6, reviews: 96, shade: "#b8d8d0", accent: "#255c57", form: "pump" },
  { id: 5, name: "Berry Buff Face Polish", category: "Face Wash", subtitle: "Berry enzymes + rice", price: 429, oldPrice: 499, rating: 4.7, reviews: 127, shade: "#d9b4bf", accent: "#733d51", form: "tube" },
  { id: 6, name: "Sandal Silk Scrub", category: "Body Scrub", subtitle: "Sandalwood + almond", price: 599, rating: 4.8, reviews: 155, shade: "#dfbf91", accent: "#81572f", form: "jar" },
];

const categories = [
  { name: "Body Wash", icon: "✦", note: "Everyday hydration", color: "#f1dfd2" },
  { name: "Body Scrub", icon: "✺", note: "Smooth & renew", color: "#dfc2a8" },
  { name: "Face Wash", icon: "◌", note: "Fresh, happy skin", color: "#dfe8d0" },
  { name: "Gift Sets", icon: "◇", note: "Made to delight", color: "#e8dce8" },
];

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-visual ${large ? "product-visual--large" : ""}`} style={{ "--shade": product.shade, "--accent": product.accent } as React.CSSProperties}>
      <span className="product-shadow" />
      <div className={`pack pack--${product.form}`}>
        {product.form === "pump" && <><span className="pump-neck" /><span className="pump-top" /></>}
        {product.form === "jar" && <span className="jar-lid" />}
        <div className="pack-label"><span>VELORA</span><b>{product.name.split(" ").slice(0, 2).join(" ")}</b><small>{product.subtitle}</small></div>
      </div>
      <span className="botanical botanical--one">✦</span>
      <span className="botanical botanical--two">●</span>
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

  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category} ${product.subtitle}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All" || product.category === category);
  }), [query, category]);

  const addToCart = (product: Product) => {
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

  return (
    <main>
      <div className="announcement"><span>PREPAID ORDERS ONLY</span><span>•</span><span>WELCOME OFFER: GLOW15</span><span>•</span><span>MADE WITH SKIN-LOVING INGREDIENTS</span></div>
      <header className="header">
        <button className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Velora home">VELORA<span>skin rituals</span></button>
        <div className="search-wrap">
          <span>⌕</span>
          <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search body wash, face care, ingredients…" />
          {query && <button aria-label="Clear search" onClick={() => setQuery("")}>×</button>}
        </div>
        <nav className={menuOpen ? "nav nav--open" : "nav"}>
          <button onClick={() => scrollToShop("All")}>Shop all</button>
          <button onClick={() => scrollToShop("Body Wash")}>Bath & body</button>
          <button onClick={() => scrollToShop("Face Wash")}>Face care</button>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
        </nav>
        <div className="header-actions">
          <button aria-label="Account"><span>♙</span><small>Account</small></button>
          <button aria-label="Wishlist"><span>♡</span><small>Wishlist</small>{liked.length > 0 && <i>{liked.length}</i>}</button>
          <button aria-label={`Shopping bag with ${cart.length} items`} onClick={() => setCartOpen(true)}><span>□</span><small>Bag</small>{cart.length > 0 && <i>{cart.length}</i>}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> BODY CARE, REIMAGINED</div>
          <h1>Your skin deserves<br /><em>a beautiful ritual.</em></h1>
          <p>Thoughtful daily care powered by effective botanicals. Gentle on your skin, gorgeous on your shelf.</p>
          <div className="hero-buttons">
            <button className="primary" onClick={() => scrollToShop()}>Shop the collection <span>→</span></button>
            <a href="#story">Discover our philosophy</a>
          </div>
          <div className="trust-row"><span>✓ Dermatologically tested</span><span>♧ Vegan formulas</span><span>♻ Mindful packaging</span></div>
        </div>
        <div className="hero-art" aria-label="Velora Moonmilk Body Wash product display">
          <div className="sun-disc" />
          <div className="hero-leaf hero-leaf--left" />
          <div className="hero-leaf hero-leaf--right" />
          <div className="stone stone--back" />
          <div className="stone stone--front" />
          <ProductVisual product={products[0]} large />
          <div className="hero-note"><b>01</b><span>Oat milk<br />+ ceramides</span></div>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading"><div><span className="kicker">SHOP BY RITUAL</span><h2>Find your daily favourite.</h2></div><button onClick={() => scrollToShop()}>View all products →</button></div>
        <div className="category-grid">
          {categories.map((item) => <button key={item.name} className="category-card" style={{ "--card": item.color } as React.CSSProperties} onClick={() => scrollToShop(item.name === "Gift Sets" ? "All" : item.name)}><span className="category-icon">{item.icon}</span><div><b>{item.name}</b><small>{item.note}</small></div><i>↗</i></button>)}
        </div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading"><div><span className="kicker">THE EDIT</span><h2>Skin-loving bestsellers.</h2></div><div className="filters">{["All", "Body Wash", "Body Scrub", "Face Wash"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
        {query && <p className="result-note">Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""} for “{query}”</p>}
        <div className="product-grid">
          {filtered.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image" onClick={() => setSelected(product)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(product)}>
                {product.badge && <span className="badge">{product.badge}</span>}
                <button className={`heart ${liked.includes(product.id) ? "heart--liked" : ""}`} aria-label={`Save ${product.name}`} onClick={(event) => { event.stopPropagation(); setLiked((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id]); }}>♥</button>
                <ProductVisual product={product} />
                <span className="quick-view">Quick view</span>
              </div>
              <div className="product-info"><div className="rating"><span>★★★★★</span> {product.rating} ({product.reviews})</div><small>{product.category}</small><h3>{product.name}</h3><p>{product.subtitle}</p><div className="price"><b>₹{product.price}</b>{product.oldPrice && <del>₹{product.oldPrice}</del>}<span>incl. taxes</span></div><button onClick={() => addToCart(product)}>Add to bag <span>＋</span></button></div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="empty-state"><span>○</span><h3>No products found</h3><p>Try a different search or explore our complete collection.</p><button className="primary" onClick={() => { setQuery(""); setCategory("All"); }}>See everything</button></div>}
      </section>

      <section className="promise" id="story">
        <div className="promise-art"><div className="arch"><ProductVisual product={products[3]} large /></div><span className="promise-seal">MADE WITH CARE<br />✦<br />FOR EVERY BODY</span></div>
        <div className="promise-copy"><span className="kicker">THE VELORA PROMISE</span><h2>Less noise.<br /><em>More nourishment.</em></h2><p>We believe body care should feel as considered as face care. So every Velora formula is made with purposeful ingredients, sensorial textures, and no unnecessary harshness.</p><ul><li><span>01</span><div><b>Ingredients with intention</b><small>Botanicals and proven actives chosen for what they do.</small></div></li><li><span>02</span><div><b>Kind to skin</b><small>Balanced, gentle formulas for everyday rituals.</small></div></li><li><span>03</span><div><b>Made for real life</b><small>Beautiful, useful care at an honest price.</small></div></li></ul><button className="text-button">Read our story →</button></div>
      </section>

      <section className="reviews"><span className="kicker">REAL SKIN. REAL STORIES.</span><h2>Loved in bathrooms everywhere.</h2><div className="review-grid"><blockquote><div>★★★★★</div><p>“The Moonmilk wash feels so creamy and my skin doesn’t feel tight after a shower. The bottle is beautiful too.”</p><footer><span>AK</span><b>Aanya K.<small>Verified buyer</small></b></footer></blockquote><blockquote><div>★★★★★</div><p>“Cocoa Cloud smells incredible and the texture is just right—not too rough, not too soft. I’m obsessed.”</p><footer><span>RM</span><b>Rhea M.<small>Verified buyer</small></b></footer></blockquote><blockquote><div>★★★★★</div><p>“Finally, a face wash that leaves my combination skin feeling clean but calm. Already on my second tube.”</p><footer><span>PS</span><b>Priya S.<small>Verified buyer</small></b></footer></blockquote></div></section>

      <section className="newsletter"><span>VELORA NOTES</span><h2>A little glow in your inbox.</h2><p>New rituals, ingredient stories, and 15% off your first order.</p><form onSubmit={(e) => { e.preventDefault(); setToast("Welcome to the Velora circle — your code is GLOW15"); }}><input type="email" required aria-label="Email address" placeholder="Your email address" /><button>Join the circle →</button></form></section>

      <footer><div><button className="logo logo--footer">VELORA<span>skin rituals</span></button><p>Thoughtful body care for small, beautiful moments.</p><div className="socials"><button>ig</button><button>p</button><button>f</button></div></div><div><b>SHOP</b><a href="#shop">Body wash</a><a href="#shop">Body scrub</a><a href="#shop">Face care</a><a href="#shop">Gift sets</a></div><div><b>HELP</b><a href="#">Contact us</a><a href="#">Shipping policy</a><a href="#">FAQs</a><a href="#">Track order</a></div><div><b>ABOUT</b><a href="#story">Our story</a><a href="#story">Ingredients</a><a href="#story">Sustainability</a><a href="#">Journal</a></div><div className="footer-contact"><b>NEED HELP?</b><p>Mon–Sat, 10am–6pm IST</p><a href="mailto:hello@velora.care">hello@velora.care</a></div></footer>
      <div className="legal"><span>© 2026 Velora. Brand concept for demonstration.</span><span>Privacy · Terms · Accessibility</span><span>Made with care in India ♡</span></div>

      {toast && <div className="toast">✓ {toast}</div>}
      {cartOpen && <><button className="overlay" aria-label="Close bag" onClick={() => setCartOpen(false)} /><aside className="cart-drawer"><div className="drawer-head"><div><small>YOUR RITUAL</small><h2>Shopping bag ({cart.length})</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>{cartProducts.length === 0 ? <div className="cart-empty"><span>□</span><h3>Your bag is waiting</h3><p>Add a little something for your skin.</p><button className="primary" onClick={() => { setCartOpen(false); scrollToShop(); }}>Start shopping</button></div> : <><div className="cart-items">{cartProducts.map((product, index) => <div className="cart-item" key={`${product.id}-${index}`}><ProductVisual product={product} /><div><small>{product.category}</small><b>{product.name}</b><p>₹{product.price}</p><button onClick={() => setCart((items) => items.filter((_, i) => i !== index))}>Remove</button></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><b>₹{cartTotal}</b></div><small>Secure online payment only. Shipping calculated at checkout.</small><button>Proceed to checkout →</button></div></>}</aside></>}
      {selected && <><button className="overlay" aria-label="Close product view" onClick={() => setSelected(null)} /><div className="modal"><button className="modal-close" onClick={() => setSelected(null)}>×</button><ProductVisual product={selected} large /><div className="modal-info"><span className="kicker">{selected.category}</span><h2>{selected.name}</h2><div className="rating"><span>★★★★★</span> {selected.rating} ({selected.reviews} reviews)</div><p>A softly cleansing, skin-comforting ritual featuring {selected.subtitle.toLowerCase()}. Made for everyday use and all skin types.</p><ul><li>Dermatologically tested</li><li>Vegan & cruelty-free</li><li>No sulphates or parabens</li></ul><div className="modal-price"><b>₹{selected.price}</b><small>250 ml · Inclusive of all taxes</small></div><button className="primary" onClick={() => { addToCart(selected); setSelected(null); }}>Add to bag →</button></div></div></>}
    </main>
  );
}
