import { requireAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export default async function CatalogAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin("/admin/catalog");
  return <><div className="admin-session-bar"><span>Signed in as <b>{admin.username}</b></span><div><a href="/admin/orders">Orders</a><a href="/admin/settings">Change password</a><form action="/api/admin/logout" method="post"><button>Logout</button></form></div></div>{children}</>;
}
