"use server";

import { saveLead, type LeadType } from "@/lib/leads-store";
import { sendLeadNotification } from "@/lib/email";

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\s().-]{8,15}$/;

function str(formData: FormData, key: string): string {
  return (formData.get(key)?.toString() || "").trim();
}

/**
 * Server Action xử lý mọi loại lead (contact/quote/partner/recruitment).
 * - Validate phía server (không tin client).
 * - Honeypot chống spam (field ẩn "website" phải rỗng).
 * - Yêu cầu đồng ý chính sách (NĐ 13/2023).
 * - Lưu trữ + gửi email (qua seam, an toàn khi chưa cấu hình).
 */
export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  // Honeypot: bot thường điền field ẩn này → coi như thành công giả để không lộ.
  if (str(formData, "hp_confirm_field")) {
    return { status: "success", message: "Gửi thành công!" };
  }

  const type = (str(formData, "type") || "contact") as LeadType;
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const company = str(formData, "company");
  const message = str(formData, "message");
  const consent = formData.get("consent");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Vui lòng nhập họ tên.";
  if (!email) errors.email = "Vui lòng nhập email.";
  else if (!EMAIL_RE.test(email)) errors.email = "Email không hợp lệ.";
  if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
  else if (!PHONE_RE.test(phone)) errors.phone = "Số điện thoại không hợp lệ.";
  if (type === "contact" && !message)
    errors.message = "Vui lòng nhập nội dung cần tư vấn.";
  if (!consent)
    errors.consent = "Bạn cần đồng ý với chính sách bảo mật để tiếp tục.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Vui lòng kiểm tra lại thông tin.", errors };
  }

  // Các trường mở rộng tuỳ loại form (báo giá, đối tác, tuyển dụng...)
  const reserved = new Set([
    "type",
    "name",
    "email",
    "phone",
    "company",
    "message",
    "consent",
    "hp_confirm_field",
  ]);
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    // Bỏ qua field nội bộ React Server Actions ($ACTION_...) khi form được
    // progressive-enhance qua useActionState — không phải dữ liệu người dùng.
    if (key.startsWith("$")) continue;
    if (!reserved.has(key) && typeof value === "string" && value.trim()) {
      payload[key] = value.trim();
    }
  }

  try {
    const lead = await saveLead({
      type,
      name,
      email,
      phone,
      company: company || undefined,
      message: message || undefined,
      payload: Object.keys(payload).length ? payload : undefined,
    });
    await sendLeadNotification(lead);
    return {
      status: "success",
      message: "Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.",
    };
  } catch {
    return {
      status: "error",
      message: "Có lỗi xảy ra, vui lòng thử lại sau.",
    };
  }
}
