import { NextResponse } from "next/server";
import { changeAdminPassword, currentAdmin } from "@/db/admin-auth";

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const form = await request.formData();
  const nextPassword = String(form.get("newPassword") ?? "");
  if (nextPassword !== String(form.get("confirmPassword") ?? "")) {
    return NextResponse.redirect(new URL("/admin/settings?error=New+passwords+do+not+match", request.url), 303);
  }
  try {
    await changeAdminPassword(admin.id, String(form.get("currentPassword") ?? ""), nextPassword);
    return NextResponse.redirect(new URL("/admin/login?changed=1", request.url), 303);
  } catch (error) {
    const url = new URL("/admin/settings", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Unable to change password");
    return NextResponse.redirect(url, 303);
  }
}
