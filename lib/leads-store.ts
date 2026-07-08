import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Lưu trữ lead (yêu cầu liên hệ/báo giá...).
 *
 * Giai đoạn 1 (hoàn thiện): lưu vào collection "leads" của Payload CMS để
 * hiển thị trong /admin, thay cho file JSON cục bộ trước đây. Chữ ký hàm
 * saveLead/getLeads giữ nguyên nên nơi gọi (app/actions/leads.ts) không đổi.
 */

export type LeadType = "contact" | "quote" | "partner" | "recruitment";

export interface Lead {
  id: string;
  type: LeadType;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message?: string;
  payload?: Record<string, string>; // các trường mở rộng tuỳ loại form
  createdAt: string;
}

const TYPE_LABELS: Record<LeadType, string> = {
  contact: "Liên hệ tư vấn",
  quote: "Yêu cầu báo giá",
  partner: "Đăng ký đối tác",
  recruitment: "Ứng tuyển",
};

export async function saveLead(
  input: Omit<Lead, "id" | "createdAt">
): Promise<Lead> {
  const payloadClient = await getPayload({ config });

  const extra = input.payload
    ? "\n\n" + Object.entries(input.payload).map(([k, v]) => `${k}: ${v}`).join("\n")
    : "";

  const doc = await payloadClient.create({
    collection: "leads",
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company || "",
      subject: TYPE_LABELS[input.type],
      message: (input.message || "") + extra,
      status: "new",
      source: "website-contact-form",
    },
  });

  return {
    id: String(doc.id),
    type: input.type,
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    message: input.message,
    payload: input.payload,
    createdAt: doc.createdAt,
  };
}

export async function getLeads(): Promise<Lead[]> {
  const payloadClient = await getPayload({ config });
  const result = await payloadClient.find({
    collection: "leads",
    limit: 100,
    sort: "-createdAt",
  });

  return result.docs.map((doc) => ({
    id: String(doc.id),
    type: "contact",
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    company: doc.company || undefined,
    message: doc.message || undefined,
    createdAt: doc.createdAt,
  }));
}
