import { getPayload } from "payload";
import config from "../../../payload.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await getPayload({ config });

    // Create order in Payload CMS
    const order = await payload.create({
      collection: "orders",
      data: {
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerCompany: body.customerCompany || "",
        shippingAddress: body.shippingAddress,
        note: body.note || "",
        items: body.items,
        subtotal: body.subtotal,
        shippingFee: body.shippingFee || 0,
        total: body.total,
        status: "pending",
        paymentMethod: body.paymentMethod,
        paymentStatus: "unpaid",
      },
    });

    // If payment method is online, return payment URL for simulation
    if (["vnpay", "momo", "zalopay"].includes(body.paymentMethod)) {
      return Response.json({
        success: true,
        orderId: order.id,
        orderNumber: body.orderNumber,
        paymentUrl: `/payment/simulate?order=${body.orderNumber}&method=${body.paymentMethod}&amount=${body.total}`,
      });
    }

    // COD or bank transfer - order created successfully
    return Response.json({
      success: true,
      orderId: order.id,
      orderNumber: body.orderNumber,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return Response.json(
      { success: false, error: error.message || "Không thể tạo đơn hàng" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return Response.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "orders",
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return Response.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return Response.json({ success: true, order: result.docs[0] });
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
