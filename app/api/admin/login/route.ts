import { loginAdmin, safeReturnTo } from "@/db/admin-auth";
import { relativeRedirect } from "../relative-redirect";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeReturnTo(form.get("returnTo"));
  try {
    await loginAdmin(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
    return relativeRedirect(returnTo);
  } catch {
    return relativeRedirect("/admin/login", {
      error: "Invalid username or password",
      returnTo,
    });
  }
}
