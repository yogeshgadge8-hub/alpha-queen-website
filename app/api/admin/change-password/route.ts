import { changeAdminPassword, currentAdmin } from "@/db/admin-auth";
import { relativeRedirect } from "../relative-redirect";

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return relativeRedirect("/admin/login");
  const form = await request.formData();
  const nextPassword = String(form.get("newPassword") ?? "");
  if (nextPassword !== String(form.get("confirmPassword") ?? "")) {
    return relativeRedirect("/admin/settings", { error: "New passwords do not match" });
  }
  try {
    await changeAdminPassword(admin.id, String(form.get("currentPassword") ?? ""), nextPassword);
    return relativeRedirect("/admin/login", { changed: "1" });
  } catch (error) {
    return relativeRedirect("/admin/settings", {
      error: error instanceof Error ? error.message : "Unable to change password",
    });
  }
}
