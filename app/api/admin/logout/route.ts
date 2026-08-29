import { NextResponse } from "next/server";
import { logoutAdmin } from "@/db/admin-auth";

export async function POST(request: Request) {
  await logoutAdmin();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
