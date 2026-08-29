import { createOrder, deleteOrder, listOrders, updateOrderStatus, validateOrder } from "@/db/orders";
import { currentAdmin } from "@/db/admin-auth";

export const dynamic = "force-dynamic";

async function adminOnly() {
  return (await currentAdmin()) ? null : Response.json({ error: "Admin login required" }, { status: 401 });
}

export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;
  try { return Response.json({ orders: await listOrders() }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load orders" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const input = validateOrder(await request.json());
    if (input.source !== "website") {
      const denied = await adminOnly();
      if (denied) return denied;
    }
    return Response.json({ order: await createOrder(input) }, { status: 201 });
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save order" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const body = await request.json() as { id?: string; status?: string };
    if (!body.id || !body.status) throw new Error("Order id and status are required");
    await updateOrderStatus(body.id, body.status);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const body = await request.json() as { id?: string };
    if (!body.id) throw new Error("Order id is required");
    await deleteOrder(body.id);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete order" }, { status: 400 }); }
}
