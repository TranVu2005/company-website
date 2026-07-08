import { verifyZaloPayCallbackMac } from "@/lib/zalopay";
import { getOrderNumberByGatewayRef, markOrderPaymentResult } from "@/lib/orders";

// Callback server-to-server của ZaloPay: chỉ được gọi khi thanh toán THÀNH
// CÔNG (không có callback riêng cho thất bại/hủy) và chỉ hoạt động khi
// Callback URL đã được cấu hình trỏ về domain public trong ZaloPay Merchant
// Portal — không tự chạy được ở localhost, tương tự IPN của MoMo/VNPay.
// ZaloPay yêu cầu phản hồi đúng định dạng {return_code, return_message}.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dataStr: string = body.data;
    const mac: string = body.mac;

    if (!dataStr || !mac || !verifyZaloPayCallbackMac(dataStr, mac)) {
      return Response.json({ return_code: -1, return_message: "mac not equal" });
    }

    const data = JSON.parse(dataStr);
    const orderNumber = await getOrderNumberByGatewayRef(data.app_trans_id);

    if (!orderNumber) {
      return Response.json({ return_code: 0, return_message: "order not found" });
    }

    await markOrderPaymentResult(orderNumber, true, String(data.zp_trans_id || ""));

    return Response.json({ return_code: 1, return_message: "success" });
  } catch (error: any) {
    console.error("ZaloPay callback error:", error);
    return Response.json({ return_code: 0, return_message: error.message });
  }
}
