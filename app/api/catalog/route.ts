import { addMedia, addMediaFile, adminCatalogState, createProduct, deleteMedia, publicCatalogSnapshot, updateInventory, updateProduct } from "@/db/catalog-state";
import { currentAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = new URL(request.url).searchParams.get("admin") === "1";
  if (admin && !(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try { return Response.json(admin ? await adminCatalogState() : await publicCatalogSnapshot()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load catalog" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "product") await updateProduct(body.product);
    else await updateInventory(body.productId, body.stock, body.lowStockThreshold);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update inventory" }, { status: 400 }); }
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData(); const file = form.get("file");
      if (!(file instanceof File)) throw new Error("Choose an image or video file");
      await addMediaFile(form.get("productId"), { bytes: new Uint8Array(await file.arrayBuffer()), mime: file.type, name: file.name }, form.get("alt"));
      return Response.json({ ok: true }, { status: 201 });
    }
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "product") await createProduct(body.product);
    else await addMedia(body.productId, body.type, body.url, body.alt);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to add media" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  try { await deleteMedia((await request.json() as { id?: unknown }).id); return Response.json({ ok: true }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete media" }, { status: 400 }); }
}
