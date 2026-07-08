import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Tài khoản quản trị (admin/biên tập viên...). Auth tích hợp sẵn của Payload.
// Giai đoạn 3 mở rộng phân quyền (admin, sales, kế toán) qua field `roles`,
// thực thi bằng hasRole() (lib/rbac.ts).
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    // Mọi nhân viên nội bộ đều xem được danh sách nhân viên khác (vd để
    // chọn "author" cho ghi chú CRM) — không cần role cụ thể.
    read: ({ req: { user } }) => user?.collection === "users",
    // Chỉ admin được tạo/sửa/xoá tài khoản nhân sự. Trước đây không có
    // access nào ở đây nên Payload mặc định Boolean(user) — bất kỳ ai đăng
    // nhập (kể cả khách hàng) tự tạo được tài khoản nhân sự, và bất kỳ nhân
    // viên role thấp nào cũng tự PATCH roles của mình thành admin.
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
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
      access: {
        // Phòng thủ kép: dù access.update ở document-level có bị nới lỏng
        // sau này (vd cho phép nhân viên tự sửa tên mình), field `roles`
        // vẫn luôn chỉ admin ghi được (cùng mô hình với Customers.segment).
        create: ({ req: { user } }) => hasRole(user, []),
        update: ({ req: { user } }) => hasRole(user, []),
      },
    },
  ],
};
