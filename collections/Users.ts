import type { CollectionConfig } from "payload";

// Tài khoản quản trị (admin/biên tập viên...). Auth tích hợp sẵn của Payload.
// Giai đoạn 3 sẽ mở rộng phân quyền (admin, sales, kế toán) qua field `roles`.
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Biên tập viên", value: "editor" },
        { label: "Sales", value: "sales" },
        { label: "Kế toán", value: "accountant" },
      ],
    },
  ],
};
