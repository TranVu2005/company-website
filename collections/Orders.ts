import type { CollectionConfig } from "payload";

// Đơn hàng (Giai đoạn 2)
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customerName", "total", "status", "paymentMethod", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true, // Public checkout
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Mã đơn hàng tự sinh, vd: NVT-20260624-001" },
    },
    {
      name: "customerName",
      type: "text",
      required: true,
      label: "Họ tên",
    },
    {
      name: "customerEmail",
      type: "email",
      required: true,
      label: "Email",
    },
    {
      name: "customerPhone",
      type: "text",
      required: true,
      label: "Số điện thoại",
    },
    {
      name: "customerCompany",
      type: "text",
      label: "Công ty",
    },
    {
      name: "shippingAddress",
      type: "textarea",
      required: true,
      label: "Địa chỉ giao hàng",
    },
    {
      name: "note",
      type: "textarea",
      label: "Ghi chú",
    },
    {
      name: "items",
      type: "array",
      required: true,
      label: "Sản phẩm",
      fields: [
        { name: "productId", type: "text", required: true },
        { name: "productName", type: "text", required: true },
        { name: "quantity", type: "number", required: true, min: 1 },
        { name: "price", type: "number", required: true },
      ],
    },
    {
      name: "subtotal",
      type: "number",
      required: true,
      label: "Tạm tính",
    },
    {
      name: "shippingFee",
      type: "number",
      defaultValue: 0,
      label: "Phí vận chuyển",
    },
    {
      name: "total",
      type: "number",
      required: true,
      label: "Tổng cộng",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Chờ thanh toán", value: "pending" },
        { label: "Đã thanh toán", value: "paid" },
        { label: "Đang xử lý", value: "processing" },
        { label: "Đang giao", value: "shipping" },
        { label: "Đã giao", value: "delivered" },
        { label: "Đã hủy", value: "cancelled" },
      ],
    },
    {
      name: "paymentMethod",
      type: "select",
      options: [
        { label: "VNPay", value: "vnpay" },
        { label: "MoMo", value: "momo" },
        { label: "ZaloPay", value: "zalopay" },
        { label: "Chuyển khoản", value: "bank_transfer" },
        { label: "COD", value: "cod" },
      ],
    },
    {
      name: "paymentStatus",
      type: "select",
      defaultValue: "unpaid",
      options: [
        { label: "Chưa thanh toán", value: "unpaid" },
        { label: "Đã thanh toán", value: "paid" },
        { label: "Thất bại", value: "failed" },
        { label: "Hoàn tiền", value: "refunded" },
      ],
    },
    {
      name: "paymentTransactionId",
      type: "text",
      label: "Mã giao dịch",
    },
  ],
};
