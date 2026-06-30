import type { CollectionConfig } from "payload";

// Công khai cho read; ghi yêu cầu đăng nhập (mặc định Payload).
const publicRead = { read: () => true };

export const Services: CollectionConfig = {
  slug: "services",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug"] },
  access: publicRead,
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Mã định danh dùng cho URL, vd: s1" },
    },
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "icon", type: "text", admin: { description: "Tên icon Lucide, vd: pie-chart" } },
    { name: "details", type: "textarea" },
    {
      name: "features",
      type: "array",
      fields: [{ name: "feature", type: "text" }],
    },
  ],
};
