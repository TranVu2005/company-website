import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendPaymentResultEmail } from "@/lib/email";

// Ghi nhận kết quả thanh toán cho một đơn hàng theo orderNumber. Dùng chung
// cho cả IPN (server-to-server) lẫn trang return (trình duyệt) của cổng
// thanh toán, vì cả hai đường đều có thể là nơi đầu tiên biết kết quả.
// An toàn khi gọi nhiều lần (idempotent): nếu đơn đã "paid" thì bỏ qua.
export async function markOrderPaymentResult(
  orderNumber: string,
  success: boolean,
  transactionId?: string
): Promise<{ ok: boolean; alreadyProcessed: boolean }> {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "orders",
    where: { orderNumber: { equals: orderNumber } },
    limit: 1,
  });

  if (result.docs.length === 0) {
    return { ok: false, alreadyProcessed: false };
  }

  const order = result.docs[0];

  if (order.paymentStatus === "paid") {
    return { ok: true, alreadyProcessed: true };
  }

  await payload.update({
    collection: "orders",
    id: order.id,
    data: {
      paymentStatus: success ? "paid" : "failed",
      paymentTransactionId: success ? transactionId || "" : "",
      status: success ? "paid" : order.status,
    },
  });

  await sendPaymentResultEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    total: order.total,
    success,
  });

  return { ok: true, alreadyProcessed: false };
}

// Lưu mã tham chiếu phía cổng thanh toán (vd: app_trans_id của ZaloPay) lên
// đơn hàng ngay khi tạo yêu cầu thanh toán, để tra cứu ngược khi nhận kết
// quả — cần thiết với các cổng không cho phép dùng thẳng orderNumber làm ID
// giao dịch (ZaloPay yêu cầu định dạng riêng cho app_trans_id).
export async function setOrderGatewayRef(
  orderNumber: string,
  gatewayRef: string
): Promise<void> {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "orders",
    where: { orderNumber: { equals: orderNumber } },
    limit: 1,
  });

  if (result.docs.length === 0) return;

  await payload.update({
    collection: "orders",
    id: result.docs[0].id,
    data: { gatewayRef },
  });
}

export async function getOrderNumberByGatewayRef(
  gatewayRef: string
): Promise<string | null> {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "orders",
    where: { gatewayRef: { equals: gatewayRef } },
    limit: 1,
  });

  if (result.docs.length === 0) return null;

  return result.docs[0].orderNumber;
}
