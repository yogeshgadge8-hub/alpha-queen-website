import { logoutAdmin } from "@/db/admin-auth";
import { relativeRedirect } from "../relative-redirect";

export async function POST(request: Request) {
  await logoutAdmin();
  return relativeRedirect("/admin/login");
}
