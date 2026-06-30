import type { CollectionConfig } from "payload";

// Kho media (ảnh sản phẩm, banner, tài liệu...). Dùng cho các giai đoạn sau.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: true,
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};
