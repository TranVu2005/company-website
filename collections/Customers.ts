import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Tài khoản khách hàng (Giai đoạn 2) — tách riêng khỏi "Users" (nhân sự nội
// bộ/admin) vì khác hoàn toàn về quyền hạn: khách hàng chỉ được xem/sửa hồ
// sơ và đơn hàng của chính mình, không truy cập được trang quản trị.
// req.user.collection sẽ là "customers" khi đăng nhập bằng tài khoản này,
// và là "users" khi đăng nhập bằng tài khoản admin — dùng để phân quyền.
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "phone", "createdAt"],
  },
  access: {
    // Cho phép đăng ký công khai (khách tự tạo tài khoản).
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false;
      // QUAN TRỌNG: trả thẳng boolean của hasRole (không phải luôn `true`)
      // để một nhân viên KHÔNG đủ quyền (vd editor) bị chặn hẳn ở đây, thay
      // vì rơi xuống nhánh { id: { equals: user.id } } phía dưới — nhánh đó
      // chỉ đúng khi user là tài khoản customers, dùng user.id (là Users.id
      // của editor) để lọc Customers.id sẽ vô tình khớp nhầm bản ghi khác.
      if (user.collection === "users") return hasRole(user, ["admin", "sales", "accountant"]);
      return { id: { equals: user.id } }; // khách chỉ xem chính mình
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return hasRole(user, ["admin", "sales", "accountant"]);
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => hasRole(user, ["admin", "sales", "accountant"]),
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Họ tên" },
    { name: "phone", type: "text", label: "Số điện thoại" },
    {
      name: "segment",
      type: "select",
      defaultValue: "new",
      label: "Nhóm khách hàng",
      options: [
        { label: "Mới", value: "new" },
        { label: "Tiềm năng", value: "potential" },
        { label: "VIP", value: "vip" },
      ],
      access: {
        // Chỉ tài khoản nội bộ (users) mới ghi được field này. Document-level
        // access của Customers cho phép khách tự sửa hồ sơ của mình VÀ tự
        // đăng ký (create: () => true), nên phải chặn cả create lẫn update —
        // thiếu create thì một khách có thể tự đăng ký với segment:"vip"
        // ngay từ đầu (Payload chỉ áp field-level access khi field.access có
        // đúng key của operation đang chạy).
        create: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
        update: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
      },
    },
    {
      name: "segmentOverride",
      type: "checkbox",
      defaultValue: false,
      label: "Ghi đè nhóm thủ công",
      admin: {
        description: "Khi bật, hệ thống không tự tính lại nhóm theo doanh số.",
      },
      access: {
        create: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
        update: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
      },
    },
  ],
};
