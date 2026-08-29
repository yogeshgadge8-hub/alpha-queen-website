import { createReview, moderateReview } from "@/db/catalog-state";
import { currentAdmin } from "@/db/admin-auth";

export async function POST(request: Request) {
  try { await createReview(await request.json()); return Response.json({ ok: true, message: "Review submitted for approval" }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to submit review" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try {
    const body = await request.json() as { id?: unknown; status?: unknown };
    await moderateReview(body.id, body.status);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to moderate review" }, { status: 400 }); }
}
