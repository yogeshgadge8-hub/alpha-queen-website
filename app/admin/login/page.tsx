import { redirect } from "next/navigation";
import { adminExists, currentAdmin } from "@/db/admin-auth";
import PasswordField from "../password-field";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; changed?: string; returnTo?: string }> }) {
  if (!(await adminExists())) redirect("/admin/setup");
  if (await currentAdmin()) redirect("/admin/orders");
  const query = await searchParams;
  return <main className="admin-auth-page"><section className="admin-auth-card"><a className="orders-logo" href="/">ALPHA QUEEN<span>admin</span></a><small>SECURE DASHBOARD</small><h1>Admin login</h1><p>Orders, customer addresses आणि social-order entry फक्त admin साठी.</p>{query.changed && <div className="auth-success">Password changed. Sign in again.</div>}{query.error && <div className="form-error">{query.error}</div>}<form action="/api/admin/login" method="post"><input type="hidden" name="returnTo" value={query.returnTo ?? "/admin/orders"} /><label><span>Username</span><input name="username" autoComplete="username" required /></label><label><span>Password</span><PasswordField name="password" autoComplete="current-password" required /></label><button className="primary">Login →</button></form><a className="auth-back" href="/">← Back to store</a></section></main>;
}
