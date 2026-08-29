import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
