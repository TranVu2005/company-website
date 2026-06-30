import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: { read: () => true },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Mã định danh dùng cho URL, vd: p1" },
    },
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text" },
    { name: "image", type: "text", admin: { description: "URL ảnh đại diện" } },
    { name: "details", type: "textarea" },
    {
      name: "features",
      type: "array",
      fields: [{ name: "feature", type: "text" }],
    },
  ],
};
