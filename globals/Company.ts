import type { GlobalConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Thông tin công ty (singleton) — dùng ở About, Contact, Footer, JSON-LD.
export const Company: GlobalConfig = {
  slug: "company",
  access: {
    read: () => true,
    // Trước đây không định nghĩa update nên mặc định Boolean(user) của
    // Payload — bất kỳ tài khoản đăng nhập nào (kể cả customers tự đăng ký
    // qua POST /api/customers) đều sửa được thông tin công ty (tên, tagline,
    // mô tả, liên hệ...) qua POST /api/globals/company.
    update: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text" },
    { name: "description", type: "textarea" },
    {
      name: "technologies",
      type: "array",
      fields: [
        { name: "techId", type: "text" },
        { name: "name", type: "text" },
        { name: "description", type: "text" },
        { name: "icon", type: "text", admin: { description: "Tên icon Lucide" } },
      ],
    },
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "address", type: "text" },
        { name: "phone", type: "text" },
        { name: "email", type: "text" },
        { name: "website", type: "text" },
      ],
    },
    {
      name: "socials",
      type: "array",
      fields: [
        { name: "platform", type: "text" },
        { name: "url", type: "text" },
      ],
    },
  ],
};
