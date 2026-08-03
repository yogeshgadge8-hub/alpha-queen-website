import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Velora — Skin Rituals for Every Body",
  description: "Thoughtful body wash, face care and skin rituals made with purposeful ingredients.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Velora — Skin Rituals for Every Body",
    description: "Your skin deserves a beautiful ritual.",
    type: "website",
    images: [{ url: "/og.png", width: 1728, height: 909, alt: "Velora premium body care collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora — Skin Rituals for Every Body",
    description: "Your skin deserves a beautiful ritual.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${cormorant.variable} ${manrope.variable}`}>{children}</body></html>;
}
