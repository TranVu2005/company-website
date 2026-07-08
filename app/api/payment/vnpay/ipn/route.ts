import { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { verifyVnpayParams } from "@/lib/vnpay";
import { markOrderPaymentResult } from "@/lib/orders";

// IPN của VNPay được gọi server-to-server bằng GET kèm query params, và
// VNPay yêu cầu phản hồi đúng định dạng {RspCode, Message} để biết đã nhận
// (khác MoMo dùng POST JSON + 204). URL này phải public khi lên production —
// cấu hình trong Merchant Portal của VNPay.
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());

    if (!verifyVnpayParams(params)) {
      return Response.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const orderNumber = params.vnp_TxnRef;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "orders",
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return Response.json({ RspCode: "01", Message: "Order not found" });
    }

    const order = result.docs[0];
    const receivedAmount = Number(params.vnp_Amount) / 100;
    if (Math.round(order.total) !== Math.round(receivedAmount)) {
      return Response.json({ RspCode: "04", Message: "Invalid amount" });
    }

    if (order.paymentStatus === "paid" || order.paymentStatus === "failed") {
      return Response.json({ RspCode: "02", Message: "Order already confirmed" });
    }

    const success =
      params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    await markOrderPaymentResult(orderNumber, success, params.vnp_TransactionNo);

    return Response.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error: any) {
    console.error("VNPay IPN error:", error);
    return Response.json({ RspCode: "99", Message: "Unknown error" });
  }
}
