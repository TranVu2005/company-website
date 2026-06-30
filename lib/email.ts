import "server-only";
import type { Lead } from "./leads-store";

/**
 * Gửi email thông báo lead cho admin.
 *
 * Giai đoạn 1: nếu chưa cấu hình RESEND_API_KEY thì chỉ log (no-op an toàn).
 * Khi có khóa, gọi Resend API. Có thể thay bằng Nodemailer/SMTP tuỳ hạ tầng.
 *
 * ENV cần thiết:
 *   RESEND_API_KEY=...
 *   LEAD_NOTIFY_TO=admin@novatech.vn
 *   LEAD_NOTIFY_FROM="NovaTech <no-reply@novatech.vn>"
 */
export async function sendLeadNotification(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.LEAD_NOTIFY_FROM || "NovaTech <onboarding@resend.dev>";

  if (!apiKey || !to) {
    // eslint-disable-next-line no-console
    console.log("[lead] (email chưa cấu hình) lead mới:", lead.id, lead.type, lead.email);
    return;
  }

  const lines = [
    `Loại: ${lead.type}`,
    `Họ tên: ${lead.name}`,
    `Email: ${lead.email}`,
    `Điện thoại: ${lead.phone}`,
    lead.company ? `Công ty: ${lead.company}` : "",
    lead.message ? `Nội dung: ${lead.message}` : "",
    ...Object.entries(lead.payload || {}).map(([k, v]) => `${k}: ${v}`),
  ].filter(Boolean);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[Lead] ${lead.type} - ${lead.name}`,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("[lead] gửi email thất bại:", res.status, await res.text());
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[lead] lỗi gửi email:", err);
  }
}
