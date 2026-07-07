import type { AdminViewServerProps } from "payload";
import { getCustomerTimeline } from "@/lib/crm";
import { hasRole } from "@/lib/rbac";

const SEGMENT_LABELS: Record<string, string> = {
  new: "Mới",
  potential: "Tiềm năng",
  vip: "VIP",
};

const KIND_LABELS: Record<string, string> = {
  order: "Đơn hàng",
  note: "Ghi chú",
  lead: "Lead",
};

export async function CrmDetailView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;

  if (!hasRole(req.user, ["admin", "sales"])) {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  // Payload 3.85.1 không điền `params.id` cho custom view cấp cao nhất khai
  // báo qua `admin.components.views` (chỉ áp dụng cho route collection/global
  // dựng sẵn) — nó chỉ truyền `params.segments` thô từ catch-all route của
  // Next.js (vd. path "/crm/:id" khớp "/admin/crm/18" thì segments =
  // ["crm", "18"]). Vì vậy phải tự lấy segment cuối làm id thay vì params.id.
  const segments = Array.isArray(params?.segments) ? (params.segments as string[]) : [];
  const id = segments[segments.length - 1];
  const customer = await req.payload.findByID({ collection: "customers", id });
  const timeline = await getCustomerTimeline(req.payload, id);

  // Các route /api/crm/* redirect 303 về đây kèm ?crmError=... khi form
  // submit thất bại (400/500), để admin thấy lý do thay vì trang JSON thô.
  const errorMessage = typeof searchParams?.crmError === "string" ? searchParams.crmError : undefined;

  return (
    <div style={{ padding: 24 }}>
      <p>
        <a href="/admin/crm">← Danh sách khách hàng</a>
      </p>
      {errorMessage ? (
        <p style={{ color: "#b91c1c", background: "#fee2e2", padding: "8px 12px", borderRadius: 4 }}>
          {errorMessage}
        </p>
      ) : null}
      <h1>{customer.name}</h1>
      <p>
        {customer.email} · {customer.phone}
      </p>
      <p>
        Nhóm hiện tại: <strong>{SEGMENT_LABELS[customer.segment as string] || customer.segment}</strong>
        {customer.segmentOverride ? " (đã ghi đè thủ công)" : ""}
      </p>

      <section style={{ margin: "16px 0" }}>
        <h2>Ghi đè nhóm</h2>
        <form action="/api/crm/segment" method="post" data-crm-form="segment">
          <input type="hidden" name="customerId" value={String(customer.id)} />
          <select name="segment" defaultValue={customer.segment as string}>
            <option value="new">Mới</option>
            <option value="potential">Tiềm năng</option>
            <option value="vip">VIP</option>
          </select>
          <button type="submit">Đặt nhóm thủ công</button>
        </form>
        {customer.segmentOverride ? (
          <form action="/api/crm/segment/auto" method="post" data-crm-form="segment-auto">
            <input type="hidden" name="customerId" value={String(customer.id)} />
            <button type="submit">Quay lại tự động</button>
          </form>
        ) : null}
      </section>

      <section style={{ margin: "16px 0" }}>
        <h2>Thêm ghi chú</h2>
        <form action="/api/crm/note" method="post" data-crm-form="note">
          <input type="hidden" name="customerId" value={String(customer.id)} />
          <select name="type" defaultValue="note">
            <option value="note">Ghi chú</option>
            <option value="call">Gọi điện</option>
            <option value="meeting">Gặp mặt</option>
            <option value="email">Email</option>
            <option value="other">Khác</option>
          </select>
          <textarea name="content" required rows={3} style={{ display: "block", width: "100%" }} />
          <button type="submit">Lưu ghi chú</button>
        </form>
      </section>

      <section>
        <h2>Dòng thời gian</h2>
        <ul>
          {timeline.map((event, index) => (
            <li key={index}>
              <strong>{KIND_LABELS[event.kind]}</strong> — {new Date(event.date).toLocaleString("vi-VN")}
              <br />
              {event.href ? <a href={event.href}>{event.title}</a> : event.title}
              {event.status ? ` (${event.status})` : ""}
              {event.detail ? <div>{event.detail}</div> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
