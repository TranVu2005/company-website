import type { CollectionConfig } from "payload";

export const News: CollectionConfig = {
  slug: "news",
  admin: { useAsTitle: "title", defaultColumns: ["title", "date", "slug"] },
  access: { read: () => true },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Mã định danh dùng cho URL, vd: n1" },
    },
    { name: "title", type: "text", required: true },
    { name: "excerpt", type: "textarea" },
    { name: "date", type: "text", admin: { description: "Hiển thị, vd: 20/05/2026" } },
    { name: "thumbnail", type: "text", admin: { description: "URL ảnh" } },
    {
      name: "content",
      type: "textarea",
      admin: { description: "Nội dung HTML của bài viết" },
    },
  ],
};
