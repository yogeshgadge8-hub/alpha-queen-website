import type { RowDataPacket } from "mysql2/promise";
import { currentAdmin } from "@/db/admin-auth";
import { database, ensureSchema } from "@/db/mysql";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSchema(); const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
  const [rows] = await database().query<(RowDataPacket & { media_blob: Uint8Array | null; media_mime: string; status: string })[]>("SELECT media_blob, media_mime, status FROM reviews WHERE id = ? LIMIT 1", [id]); const row = rows[0];
  if (!row?.media_blob || !row.media_mime || (row.status !== "approved" && !(await currentAdmin()))) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.media_blob), { headers: { "content-type": row.media_mime, "cache-control": row.status === "approved" ? "public, max-age=86400" : "private, no-store", "x-content-type-options": "nosniff" } });
}
