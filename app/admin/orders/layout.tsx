import type { Metadata } from "next";
import { requireAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Desk — Alpha Queen Cosmetics",
  description: "Private order entry, management and printing desk.",
  robots: { index: false, follow: false },
};

export default async function OrdersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin("/admin/orders");
  return <><div className="admin-session-bar"><span>Signed in as <b>{admin.username}</b></span><div><a href="/admin/analytics">Analytics</a><a href="/admin/catalog">Products & content</a><a href="/admin/settings">Change password</a><form action="/api/admin/logout" method="post"><button>Logout</button></form></div></div>{children}</>;
}
