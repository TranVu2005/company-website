import type { CollectionConfig } from "payload";

export const Team: CollectionConfig = {
  slug: "team",
  admin: { useAsTitle: "name", defaultColumns: ["name", "role", "slug"] },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "role", type: "text" },
    { name: "bio", type: "textarea" },
    { name: "avatar", type: "text", admin: { description: "URL ảnh đại diện" } },
  ],
};
