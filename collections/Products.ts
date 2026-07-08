import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Products: CollectionConfig = {
  slug: "products",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
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
    {
      name: "price",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { description: "Giá bán (VNĐ), vd: 2500000" },
    },
    { name: "image", type: "text", admin: { description: "URL ảnh đại diện" } },
    { name: "details", type: "textarea" },
    {
      name: "features",
      type: "array",
      fields: [{ name: "feature", type: "text" }],
    },
  ],
};
