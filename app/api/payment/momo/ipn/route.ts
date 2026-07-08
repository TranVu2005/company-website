import { verifyMomoSignature } from "@/lib/momo";
import { markOrderPaymentResult } from "@/lib/orders";
import { getErrorMessage } from "@/lib/errors";

// IPN (Instant Payment Notification): MoMo gọi thẳng server-to-server sau
// khi khách thanh toán xong, không qua trình duyệt của khách — đây là nguồn
// xác nhận đáng tin cậy nhất (khách có thể tắt trình duyệt trước khi được
// redirect về, nhưng IPN vẫn được gửi). Yêu cầu URL này phải public (không
// chạy được với localhost khi phát triển cục bộ trừ khi dùng tunnel như
// ngrok) — khi deploy lên domain thật, cấu hình NEXT_PUBLIC_SITE_URL và MoMo
// sẽ tự gọi tới đây.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const isValid = verifyMomoSignature({
      partnerCode: body.partnerCode,
      orderId: body.orderId,
      requestId: body.requestId,
      amount: String(body.amount),
      orderInfo: body.orderInfo,
      orderType: body.orderType,
      transId: String(body.transId),
      resultCode: String(body.resultCode),
      message: body.message,
      payType: body.payType,
      responseTime: String(body.responseTime),
      extraData: body.extraData || "",
      signature: body.signature,
    });

    if (!isValid) {
      console.error("MoMo IPN: invalid signature", body.orderId);
      return Response.json({ message: "Invalid signature" }, { status: 400 });
    }

    const success = Number(body.resultCode) === 0;
    await markOrderPaymentResult(body.orderId, success, String(body.transId));

    // MoMo yêu cầu phản hồi nhanh với HTTP 204/200 để xác nhận đã nhận IPN.
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    console.error("MoMo IPN error:", error);
    return Response.json({ message: getErrorMessage(error) }, { status: 500 });
  }
}
