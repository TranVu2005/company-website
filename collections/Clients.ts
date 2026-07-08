import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "logo", type: "text", admin: { description: "URL logo" } },
  ],
};
