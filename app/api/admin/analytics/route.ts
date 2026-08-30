import { currentAdmin } from "@/db/admin-auth";
import { analyticsSnapshot, updateAnalyticsSettings } from "@/db/analytics";

export const dynamic = "force-dynamic";

async function denied() {
  return (await currentAdmin()) ? null : Response.json({ error: "Admin login required" }, { status: 401 });
}

export async function GET() {
  const unauthorized = await denied();
  if (unauthorized) return unauthorized;
  try { return Response.json(await analyticsSnapshot()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load analytics" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const unauthorized = await denied();
  if (unauthorized) return unauthorized;
  try { await updateAnalyticsSettings(await request.json()); return Response.json(await analyticsSnapshot()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save analytics costs" }, { status: 400 }); }
}
