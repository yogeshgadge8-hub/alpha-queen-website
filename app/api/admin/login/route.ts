import { NextResponse } from "next/server";
import { loginAdmin, safeReturnTo } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeReturnTo(form.get("returnTo"));
  try {
    await loginAdmin(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "Invalid username or password");
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url, 303);
  }
}
