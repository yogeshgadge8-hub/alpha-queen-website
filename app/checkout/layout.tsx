import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Checkout — Alpha Queen Cosmetics",
  description: "Secure prepaid Alpha Queen checkout with mobile number and delivery address.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
