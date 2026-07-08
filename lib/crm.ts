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

export type TimelineEvent = {
  kind: "lead" | "order" | "note";
  date: string;
  title: string;
  detail?: string;
  status?: string;
  href?: string;
};

/**
 * Gộp lead (liên kết mềm theo email) + đơn hàng + ghi chú sales của 1 khách
 * thành một dòng thời gian, sắp xếp mới nhất trước.
 */
export async function getCustomerTimeline(payload: Payload, customerId: string | number): Promise<TimelineEvent[]> {
  const customer = await payload.findByID({ collection: "customers", id: customerId });

  const [orders, notes, leads] = await Promise.all([
    payload.find({
      collection: "orders",
      where: { customer: { equals: customerId } },
      limit: 0,
    }),
    payload.find({
      collection: "customer-notes",
      where: { customer: { equals: customerId } },
      limit: 0,
      depth: 1,
    }),
    payload.find({
      collection: "leads",
      // Không có email khách (hiếm, dữ liệu thiếu) → where không khớp gì cả,
      // trả về docs rỗng, tránh phải tự tạo shape kết quả giả (any) khớp tay
      // với PaginatedDocs của payload.find.
      where: customer?.email ? { email: { equals: customer.email } } : { id: { equals: -1 } },
      limit: 0,
    }),
  ]);

  const events: TimelineEvent[] = [];

  for (const order of orders.docs) {
    events.push({
      kind: "order",
      date: order.createdAt,
      title: `Đơn ${order.orderNumber} — ${(order.total || 0).toLocaleString("vi-VN")}đ`,
      status: order.paymentStatus,
      href: `/admin/collections/orders/${order.id}`,
    });
  }

  for (const note of notes.docs) {
    const author =
      note.author && typeof note.author === "object"
        ? note.author.name || note.author.email
        : "";
    events.push({
      kind: "note",
      date: note.createdAt,
      title: `Ghi chú (${note.type})${author ? ` — ${author}` : ""}`,
      detail: note.content,
    });
  }

  for (const lead of leads.docs) {
    events.push({
      kind: "lead",
      date: lead.createdAt,
      title: `Lead: ${lead.subject}`,
      status: lead.status,
      href: `/admin/collections/leads/${lead.id}`,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}
