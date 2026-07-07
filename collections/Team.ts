import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Team: CollectionConfig = {
  slug: "team",
  admin: { useAsTitle: "name", defaultColumns: ["name", "role", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "role", type: "text" },
    { name: "bio", type: "textarea" },
    { name: "avatar", type: "text", admin: { description: "URL ảnh đại diện" } },
  ],
};
