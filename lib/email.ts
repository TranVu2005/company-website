import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
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
  const from = `NovaTech Solutions <${process.env.LEAD_NOTIFY_FROM || "onboarding@resend.dev"}>`;

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

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderEmailInfo {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: OrderEmailItem[];
}

/**
 * Email xác nhận đơn hàng mới, gửi qua adapter Resend đã cấu hình trong
 * payload.config.ts. No-op an toàn khi RESEND_API_KEY chưa được đặt.
 */
export async function sendOrderConfirmation(order: OrderEmailInfo): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log("[order] (email chưa cấu hình) xác nhận đơn hàng:", order.orderNumber);
    return;
  }

  const itemLines = order.items
    .map((i) => `- ${i.productName} x${i.quantity}: ${(i.price * i.quantity).toLocaleString("vi-VN")} đ`)
    .join("\n");

  try {
    const payloadClient = await getPayload({ config });
    await payloadClient.sendEmail({
      to: order.customerEmail,
      subject: `Xác nhận đơn hàng ${order.orderNumber}`,
      text: `Chào ${order.customerName},\n\nCảm ơn bạn đã đặt hàng tại NovaTech. Đơn hàng ${order.orderNumber} đã được ghi nhận:\n\n${itemLines}\n\nTổng cộng: ${order.total.toLocaleString("vi-VN")} đ\n\nChúng tôi sẽ liên hệ xác nhận và giao hàng trong thời gian sớm nhất.`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[order] lỗi gửi email xác nhận đơn hàng:", err);
  }
}

/**
 * Email báo kết quả thanh toán (thành công/thất bại). No-op an toàn khi
 * RESEND_API_KEY chưa được đặt.
 */
export async function sendPaymentResultEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  success: boolean;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log("[order] (email chưa cấu hình) kết quả thanh toán:", order.orderNumber, order.success);
    return;
  }

  try {
    const payloadClient = await getPayload({ config });
    await payloadClient.sendEmail({
      to: order.customerEmail,
      subject: order.success
        ? `Thanh toán thành công - Đơn ${order.orderNumber}`
        : `Thanh toán thất bại - Đơn ${order.orderNumber}`,
      text: order.success
        ? `Chào ${order.customerName},\n\nĐơn hàng ${order.orderNumber} đã được thanh toán thành công với số tiền ${order.total.toLocaleString("vi-VN")} đ. Cảm ơn bạn!`
        : `Chào ${order.customerName},\n\nGiao dịch thanh toán cho đơn hàng ${order.orderNumber} không thành công. Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[order] lỗi gửi email kết quả thanh toán:", err);
  }
}
