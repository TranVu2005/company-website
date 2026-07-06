import type { CollectionConfig } from "payload";

// Collection lưu thông tin liên hệ từ form website (Giai đoạn 1)
export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "phone", "subject", "status", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => user?.collection === "users",
    create: () => true, // Public form submission
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text", required: true },
    { name: "company", type: "text" },
    { name: "subject", type: "text", required: true },
    { name: "message", type: "textarea", required: true },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "Mới", value: "new" },
        { label: "Đang xử lý", value: "processing" },
        { label: "Đã liên hệ", value: "contacted" },
        { label: "Đã chốt", value: "converted" },
        { label: "Huỷ", value: "cancelled" },
      ],
    },
    { name: "source", type: "text", defaultValue: "website" },
    { name: "notes", type: "textarea" },
  ],
};
