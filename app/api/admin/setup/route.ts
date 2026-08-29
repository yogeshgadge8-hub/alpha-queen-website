import { NextResponse } from "next/server";
import { setupAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirmPassword") ?? "")) {
    return NextResponse.redirect(new URL("/admin/setup?error=Passwords+do+not+match", request.url), 303);
  }
  try {
    await setupAdmin(String(form.get("username") ?? ""), password);
    return NextResponse.redirect(new URL("/admin/orders", request.url), 303);
  } catch (error) {
    const url = new URL("/admin/setup", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Unable to create admin account");
    return NextResponse.redirect(url, 303);
  }
}
