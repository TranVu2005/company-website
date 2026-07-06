import type { AdminViewServerProps } from "payload";

const SEGMENT_LABELS: Record<string, string> = {
  new: "Mới",
  potential: "Tiềm năng",
  vip: "VIP",
};

export async function CrmListView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;

  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  const segmentFilter = typeof searchParams?.segment === "string" ? searchParams.segment : undefined;

  const [customers, paidOrders] = await Promise.all([
    req.payload.find({
      collection: "customers",
      where: segmentFilter ? { segment: { equals: segmentFilter } } : undefined,
      limit: 200,
    }),
    // Đọc toàn bộ đơn đã thanh toán 1 lần rồi gộp theo customer trong JS,
    // tránh N+1 query (1 query / khách) khi danh sách khách hàng dài.
    req.payload.find({
      collection: "orders",
      where: { paymentStatus: { equals: "paid" } },
      limit: 0,
      depth: 0,
    }),
  ]);

  const statsByCustomer = new Map<string, { total: number; count: number }>();
  for (const order of paidOrders.docs) {
    const key = String(order.customer);
    const prev = statsByCustomer.get(key) || { total: 0, count: 0 };
    statsByCustomer.set(key, { total: prev.total + (order.total || 0), count: prev.count + 1 });
  }

  const rows = customers.docs
    .map((customer) => {
      const stats = statsByCustomer.get(String(customer.id)) || { total: 0, count: 0 };
      return { customer, ...stats };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 24 }}>
      <h1>CRM — Khách hàng</h1>
      <div style={{ margin: "12px 0" }}>
        <a href="/admin/crm">Tất cả</a>
        {" · "}
        <a href="/admin/crm?segment=new">Mới</a>
        {" · "}
        <a href="/admin/crm?segment=potential">Tiềm năng</a>
        {" · "}
        <a href="/admin/crm?segment=vip">VIP</a>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Tên</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "left" }}>SĐT</th>
            <th style={{ textAlign: "left" }}>Nhóm</th>
            <th style={{ textAlign: "right" }}>Tổng chi tiêu</th>
            <th style={{ textAlign: "right" }}>Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ customer, total, count }) => (
            <tr key={customer.id}>
              <td>
                <a href={`/admin/crm/${customer.id}`}>{customer.name}</a>
              </td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{SEGMENT_LABELS[customer.segment as string] || customer.segment}</td>
              <td style={{ textAlign: "right" }}>{total.toLocaleString("vi-VN")}đ</td>
              <td style={{ textAlign: "right" }}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
