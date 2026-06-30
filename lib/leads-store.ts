import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Lưu trữ lead (yêu cầu liên hệ/báo giá...).
 *
 * Giai đoạn 1: ghi ra file JSON cục bộ (.data/leads.json) — đủ để chạy local
 * và làm "seam" rõ ràng. Giai đoạn 1 (hoàn thiện)/Giai đoạn 3: thay thân hàm
 * saveLead/getLeads bằng Prisma/Payload mà KHÔNG đổi nơi gọi.
 *
 * Lưu ý: trên môi trường serverless (Vercel) filesystem chỉ đọc — cần chuyển
 * sang DB trước khi deploy production.
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

const DATA_DIR = path.join(process.cwd(), ".data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

async function readAll(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf-8");
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

export async function saveLead(
  input: Omit<Lead, "id" | "createdAt">
): Promise<Lead> {
  const lead: Lead = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = await readAll();
  all.push(lead);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LEADS_FILE, JSON.stringify(all, null, 2), "utf-8");
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  return readAll();
}
