import type { RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSchema(); const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
  const [rows] = await database().query<(RowDataPacket & { media_blob: Uint8Array | null; media_mime: string })[]>("SELECT media_blob, media_mime FROM product_media WHERE id = ? LIMIT 1", [id]); const row = rows[0];
  if (!row?.media_blob || !row.media_mime) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.media_blob), { headers: { "content-type": row.media_mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
