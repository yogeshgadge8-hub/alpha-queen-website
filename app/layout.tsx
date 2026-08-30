import type { Metadata } from "next";
import "./globals.css";

// The storefront changes frequently while products and launch content are being prepared.
// Rendering dynamically prevents Hostinger's CDN from caching HTML that points to removed
// versioned CSS/JS assets after a new deployment.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  metadataBase: new URL("https://alphaqueenofficial.com"),
  title: "Alpha Queen Cosmetics — Everyday Beauty, Made for Your Glow",
  description: "Shop Alpha Queen body wash, face wash, body scrub and everyday cosmetic essentials.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Alpha Queen Cosmetics",
    description: "Everyday beauty, made for your glow.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Alpha Queen Cosmetics collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha Queen Cosmetics",
    description: "Everyday beauty, made for your glow.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
