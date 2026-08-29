import { createOrder, deleteOrder, listOrders, updateOrderStatus, validateOrder } from "@/db/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ orders: await listOrders() }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load orders" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { return Response.json({ order: await createOrder(validateOrder(await request.json())) }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save order" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: string; status?: string };
    if (!body.id || !body.status) throw new Error("Order id and status are required");
    await updateOrderStatus(body.id, body.status);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { id?: string };
    if (!body.id) throw new Error("Order id is required");
    await deleteOrder(body.id);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete order" }, { status: 400 }); }
}
