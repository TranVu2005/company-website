import { getPayload } from "payload";
import config from "../../../../payload.config";

export async function POST(request: Request) {
  try {
    const { orderNumber, status, transactionId } = await request.json();
    const payload = await getPayload({ config });

    // Find the order
    const result = await payload.find({
      collection: "orders",
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.docs[0];

    // Update order payment status
    await payload.update({
      collection: "orders",
      id: order.id,
      data: {
        paymentStatus: status === "paid" ? "paid" : "failed",
        paymentTransactionId: transactionId || "",
        status: status === "paid" ? "paid" : order.status,
      },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Payment callback error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
