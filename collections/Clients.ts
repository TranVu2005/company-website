import type { CollectionConfig } from "payload";

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "logo", type: "text", admin: { description: "URL logo" } },
  ],
};
