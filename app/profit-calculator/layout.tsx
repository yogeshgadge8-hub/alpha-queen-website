import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Profit Calculator — Velora",
  description: "Private per-order unit economics calculator for Velora products.",
  robots: { index: false, follow: false },
};

export default function CalculatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
