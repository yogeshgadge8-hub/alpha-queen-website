import { redirect } from "next/navigation";
import { adminExists } from "@/db/admin-auth";
import PasswordField from "../password-field";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await adminExists()) redirect("/admin/login");
  const query = await searchParams;
  return <main className="admin-auth-page"><section className="admin-auth-card"><a className="orders-logo" href="/">ALPHA QUEEN<span>admin setup</span></a><small>ONE-TIME SETUP</small><h1>Create your admin login</h1><p>हा setup फक्त एकदाच चालेल. मजबूत password निवडा; तो आम्ही plain text मध्ये save करत नाही.</p>{query.error && <div className="form-error">{query.error}</div>}<form action="/api/admin/setup" method="post"><label><span>Admin username</span><input name="username" minLength={4} maxLength={40} autoComplete="username" required /></label><label><span>Password (minimum 12 characters)</span><PasswordField name="password" minLength={12} autoComplete="new-password" required /></label><label><span>Confirm password</span><PasswordField name="confirmPassword" minLength={12} autoComplete="new-password" required /></label><button className="primary">Create secure admin →</button></form></section></main>;
}
