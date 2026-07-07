import "server-only";
import type { Payload } from "payload";

export type DashboardRange = "today" | "7d" | "30d";

export type DashboardMetrics = {
  range: DashboardRange;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  dailyTrend: { date: string; total: number }[];
  topProducts: { productId: string; productName: string; quantitySold: number }[];
};

const RANGE_DAYS: Record<DashboardRange, number> = { today: 1, "7d": 7, "30d": 30 };

export function parseDashboardRange(value: unknown): DashboardRange {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d";
}

function getRangeBounds(range: DashboardRange): { start: Date; end: Date; days: number } {
  const days = RANGE_DAYS[range];
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start, end, days };
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Tính doanh thu/số đơn/AOV/xu hướng theo ngày/top sản phẩm bán chạy từ các
 * đơn đã thanh toán (paymentStatus === "paid") trong khoảng thời gian chọn.
 * Dùng createdAt làm mốc thời gian vì Orders không có field riêng cho thời
 * điểm thanh toán (giới hạn đã ghi trong spec).
 */
export async function getDashboardMetrics(payload: Payload, rangeInput: unknown): Promise<DashboardMetrics> {
  const range = parseDashboardRange(rangeInput);
  const { start, end, days } = getRangeBounds(range);

  const paidOrders = await payload.find({
    collection: "orders",
    where: {
      paymentStatus: { equals: "paid" },
      createdAt: { greater_than_equal: start.toISOString(), less_than_equal: end.toISOString() },
    },
    limit: 0,
    depth: 0,
  });

  let totalRevenue = 0;
  const revenueByDay = new Map<string, number>();
  const quantityByProduct = new Map<string, { productName: string; quantitySold: number }>();

  for (const order of paidOrders.docs) {
    totalRevenue += order.total || 0;

    const key = dateKey(new Date(order.createdAt));
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + (order.total || 0));

    for (const item of order.items || []) {
      const prev = quantityByProduct.get(item.productId) || { productName: item.productName, quantitySold: 0 };
      quantityByProduct.set(item.productId, {
        productName: item.productName,
        quantitySold: prev.quantitySold + (item.quantity || 0),
      });
    }
  }

  const dailyTrend: { date: string; total: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    dailyTrend.push({ date: key, total: revenueByDay.get(key) || 0 });
  }

  const topProducts = [...quantityByProduct.entries()]
    .map(([productId, { productName, quantitySold }]) => ({ productId, productName, quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  const orderCount = paidOrders.docs.length;
  const averageOrderValue = orderCount === 0 ? 0 : totalRevenue / orderCount;

  return { range, totalRevenue, orderCount, averageOrderValue, dailyTrend, topProducts };
}
