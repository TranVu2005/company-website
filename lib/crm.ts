import "server-only";
import type { Payload } from "payload";

export type CustomerSegment = "new" | "potential" | "vip";

const VIP_MIN_TOTAL = 5_000_000;
const VIP_MIN_ORDER_COUNT = 3;

export function computeSegmentForOrders(paidTotal: number, paidCount: number): CustomerSegment {
  if (paidCount === 0) return "new";
  if (paidTotal >= VIP_MIN_TOTAL || paidCount >= VIP_MIN_ORDER_COUNT) return "vip";
  return "potential";
}

/**
 * Tính lại và lưu segment cho 1 khách hàng dựa trên các đơn đã thanh toán.
 * Bỏ qua nếu segmentOverride === true (admin đã ghi đè tay).
 */
export async function recomputeSegment(payload: Payload, customerId: string | number): Promise<void> {
  const customer = await payload.findByID({ collection: "customers", id: customerId });
  if (!customer || customer.segmentOverride) return;

  const paidOrders = await payload.find({
    collection: "orders",
    where: {
      customer: { equals: customerId },
      paymentStatus: { equals: "paid" },
    },
    limit: 0,
  });

  const paidTotal = paidOrders.docs.reduce((sum, order) => sum + (order.total || 0), 0);
  const nextSegment = computeSegmentForOrders(paidTotal, paidOrders.docs.length);

  if (customer.segment !== nextSegment) {
    await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment: nextSegment },
    });
  }
}
