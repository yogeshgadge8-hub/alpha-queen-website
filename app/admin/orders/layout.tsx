import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Desk — Alpha Queen Cosmetics",
  description: "Private order entry, management and printing desk.",
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
