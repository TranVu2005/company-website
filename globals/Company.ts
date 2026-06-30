import type { GlobalConfig } from "payload";

// Thông tin công ty (singleton) — dùng ở About, Contact, Footer, JSON-LD.
export const Company: GlobalConfig = {
  slug: "company",
  access: { read: () => true },
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
