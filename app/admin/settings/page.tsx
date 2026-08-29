import { requireAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin("/admin/settings");
  const query = await searchParams;
  return <main className="admin-auth-page"><section className="admin-auth-card"><a className="orders-logo" href="/admin/orders">ALPHA QUEEN<span>admin settings</span></a><small>ACCOUNT SECURITY</small><h1>Change password</h1><p>Logged in as <b>{admin.username}</b>. Password बदलल्यावर सर्व sessions logout होतील.</p>{query.error && <div className="form-error">{query.error}</div>}<form action="/api/admin/change-password" method="post"><label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label><label><span>New password (minimum 12 characters)</span><input name="newPassword" type="password" minLength={12} autoComplete="new-password" required /></label><label><span>Confirm new password</span><input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></label><button className="primary">Change password →</button></form><a className="auth-back" href="/admin/orders">← Back to order desk</a></section></main>;
}
