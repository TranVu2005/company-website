import type { CollectionConfig } from "payload";
import { recomputeSegment } from "../lib/crm";

// Đơn hàng (Giai đoạn 2) — bắt buộc gắn với một tài khoản khách hàng
// (collection "customers"), không còn cho đặt hàng dạng khách vãng lai.
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customerName", "total", "status", "paymentMethod", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return true; // admin xem tất cả đơn
      return { customer: { equals: user.id } }; // khách chỉ xem đơn của mình
    },
    // Đơn chỉ được tạo bởi khách đã đăng nhập (qua app/api/orders/route.ts,
    // route này tự xác thực bằng payload.auth() trước khi gọi payload.create)
    // hoặc bởi admin thao tác trong trang quản trị.
    create: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Không để lỗi tính segment làm hỏng việc lưu đơn hàng — đơn hàng
        // quan trọng hơn nhãn CRM, nên bọc try/catch và chỉ log khi lỗi.
        try {
          const customerId = typeof doc.customer === "object" ? doc.customer.id : doc.customer;
          await recomputeSegment(req.payload, customerId);
        } catch (err) {
          console.error("[crm] recompute segment (afterChange) lỗi:", err);
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          const customerId = typeof doc.customer === "object" ? doc.customer.id : doc.customer;
          await recomputeSegment(req.payload, customerId);
        } catch (err) {
          console.error("[crm] recompute segment (afterDelete) lỗi:", err);
        }
      },
    ],
  },
  fields: [
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: true,
      label: "Khách hàng",
    },
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
    {
      name: "gatewayRef",
      type: "text",
      label: "Mã tham chiếu cổng thanh toán",
      admin: {
        description:
          "Mã giao dịch phía cổng thanh toán trước khi có kết quả (vd: app_trans_id của ZaloPay), dùng để tra cứu ngược khi nhận callback.",
      },
    },
  ],
};
