import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Kho media (ảnh sản phẩm, banner, tài liệu...). Dùng cho các giai đoạn sau.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  upload: true,
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};
