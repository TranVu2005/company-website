"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    note: "",
    paymentMethod: "vnpay",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderNumber = `NVT-${Date.now()}`;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          customerCompany: form.company,
          shippingAddress: form.address,
          note: form.note,
          paymentMethod: form.paymentMethod,
          items: items.map((item) => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: totalPrice(),
          shippingFee: 0,
          total: totalPrice(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        router.push(`/orders/${orderNumber}?status=new`);
      } else {
        alert(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Không có sản phẩm</h1>
        <p className="text-gray-500 mb-6">Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.</p>
        <Link href="/products" className="px-6 py-3 bg-primary text-white rounded-lg">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Đặt hàng</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Thông tin giao hàng</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Họ và tên *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Công ty</label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng *</label>
            <textarea
              name="address"
              required
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              name="note"
              rows={2}
              value={form.note}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Phương thức thanh toán</h2>

          <div className="space-y-2">
            {[
              { value: "vnpay", label: "VNPay (QR / Thẻ ngân hàng)" },
              { value: "momo", label: "Ví MoMo" },
              { value: "zalopay", label: "ZaloPay" },
              { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
              { value: "cod", label: "Thanh toán khi nhận hàng (COD)" },
            ].map((method) => (
              <label
                key={method.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  form.paymentMethod === method.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={form.paymentMethod === method.value}
                  onChange={handleChange}
                  className="text-primary"
                />
                <span>{method.label}</span>
              </label>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Đơn hàng ({items.length} sản phẩm)</h3>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString("vi-VN")} đ</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{totalPrice().toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
