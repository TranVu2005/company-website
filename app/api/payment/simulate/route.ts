import { getPayload } from "payload";
import config from "../../../../payload.config";
import { sendPaymentResultEmail } from "@/lib/email";

// Mô phỏng cổng thanh toán (Giai đoạn 2 - chưa tích hợp VNPay/MoMo/ZaloPay thật).
// Kết quả thành công/thất bại được quyết định và áp dụng hoàn toàn ở server để
// client không thể tự ý đánh dấu đơn hàng là "đã thanh toán".
export async function POST(request: Request) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber || typeof orderNumber !== "string") {
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

    const order = result.docs[0];

    if (order.paymentStatus === "paid") {
      return Response.json({ success: true, status: "paid" });
    }

    const isSuccess = Math.random() > 0.1;
    const transactionId = `TXN-${Date.now()}`;

    await payload.update({
      collection: "orders",
      id: order.id,
      data: {
        paymentStatus: isSuccess ? "paid" : "failed",
        paymentTransactionId: isSuccess ? transactionId : "",
        status: isSuccess ? "paid" : order.status,
      },
    });

    await sendPaymentResultEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      success: isSuccess,
    });

    return Response.json({ success: true, status: isSuccess ? "paid" : "failed" });
  } catch (error: any) {
    console.error("Payment simulate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
