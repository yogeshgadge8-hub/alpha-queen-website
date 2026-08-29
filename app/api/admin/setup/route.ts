import { setupAdmin } from "@/db/admin-auth";
import { relativeRedirect } from "../relative-redirect";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirmPassword") ?? "")) {
    return relativeRedirect("/admin/setup", { error: "Passwords do not match" });
  }
  try {
    await setupAdmin(String(form.get("username") ?? ""), password);
    return relativeRedirect("/admin/orders");
  } catch (error) {
    return relativeRedirect("/admin/setup", {
      error: error instanceof Error ? error.message : "Unable to create admin account",
    });
  }
}
