import type { CollectionConfig } from "payload";

// Ghi chú/hoạt động sales gắn với 1 khách hàng (Giai đoạn 3 - CRM). Hoàn toàn
// nội bộ: khách hàng không bao giờ được đọc hay ghi nhóm dữ liệu này, vì đây
// là ghi chú NỘI BỘ về khách (vd "đã gọi, khách còn đang cân nhắc giá").
export const CustomerNotes: CollectionConfig = {
  slug: "customer-notes",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["customer", "type", "author", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => user?.collection === "users",
    create: ({ req: { user } }) => user?.collection === "users",
    update: ({ req: { user } }) => user?.collection === "users",
    delete: ({ req: { user } }) => user?.collection === "users",
  },
  fields: [
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "type",
      type: "select",
      defaultValue: "note",
      options: [
        { label: "Ghi chú", value: "note" },
        { label: "Gọi điện", value: "call" },
        { label: "Gặp mặt", value: "meeting" },
        { label: "Email", value: "email" },
        { label: "Khác", value: "other" },
      ],
    },
    {
      name: "content",
      type: "textarea",
      required: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
      hooks: {
        beforeChange: [({ req, value }) => value ?? req.user?.id],
      },
    },
  ],
};
