import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Công khai cho read; ghi chỉ role admin (trước đây mặc định Boolean(user)
// của Payload — bất kỳ ai đăng nhập, kể cả khách hàng, cũng ghi được).
const publicRead: CollectionConfig["access"] = {
  read: () => true,
  create: ({ req: { user } }) => hasRole(user, []),
  update: ({ req: { user } }) => hasRole(user, []),
  delete: ({ req: { user } }) => hasRole(user, []),
};

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
