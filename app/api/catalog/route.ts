import { addMedia, adminCatalogState, deleteMedia, publicCatalogState, updateInventory } from "@/db/catalog-state";
import { currentAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = new URL(request.url).searchParams.get("admin") === "1";
  if (admin && !(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try { return Response.json(admin ? await adminCatalogState() : { catalog: await publicCatalogState() }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load catalog" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    await updateInventory(body.productId, body.stock, body.lowStockThreshold);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update inventory" }, { status: 400 }); }
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    await addMedia(body.productId, body.type, body.url, body.alt);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to add media" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try { await deleteMedia((await request.json() as { id?: unknown }).id); return Response.json({ ok: true }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete media" }, { status: 400 }); }
}
