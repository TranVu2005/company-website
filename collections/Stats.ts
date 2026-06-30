import type { CollectionConfig } from "payload";

export const Stats: CollectionConfig = {
  slug: "stats",
  admin: { useAsTitle: "label", defaultColumns: ["label", "value", "suffix"] },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "value", type: "number", required: true },
    { name: "label", type: "text", required: true },
    { name: "suffix", type: "text", defaultValue: "" },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: { description: "Thứ tự hiển thị" },
    },
  ],
};
