"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useCustomerAuth } from "@/components/CustomerAuthContext";
import { CreditCard, Wallet, Landmark, Banknote, QrCode } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "vnpay", label: "VNPay", hint: "QR / Thẻ ngân hàng", icon: QrCode },
  { value: "momo", label: "Ví MoMo", hint: "Thanh toán qua ví MoMo", icon: Wallet },
  { value: "zalopay", label: "ZaloPay", hint: "Thanh toán qua ví ZaloPay", icon: CreditCard },
  { value: "bank_transfer", label: "Chuyển khoản", hint: "Chuyển khoản ngân hàng", icon: Landmark },
  { value: "cod", label: "COD", hint: "Thanh toán khi nhận hàng", icon: Banknote },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { customer, loading: authLoading } = useCustomerAuth();
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

  // Bắt buộc đăng nhập mới được đặt hàng — chờ xác định xong trạng thái
  // đăng nhập rồi mới quyết định điều hướng, tránh redirect nhầm lúc đang
  // tải.
  useEffect(() => {
    if (!authLoading && !customer) {
      router.push("/login?redirect=/checkout");
    }
  }, [authLoading, customer, router]);

  // Điền sẵn thông tin từ tài khoản, khách vẫn có thể sửa lại (vd giao hàng
  // hộ người khác).
  useEffect(() => {
    if (customer) {
      setForm((f) => ({ ...f, name: customer.name || f.name, email: customer.email || f.email, phone: customer.phone || f.phone }));
    }
  }, [customer]);

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
        credentials: "include",
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
        if (data.paymentUrl) {
          // Đơn hàng đang chờ thanh toán online (MoMo/VNPay/ZaloPay) — CHƯA
          // xoá giỏ hàng ở đây. Nếu khách thoát giữa chừng và quay lại, giỏ
          // hàng vẫn còn nguyên sản phẩm để đặt lại thay vì mất trắng. Giỏ
          // hàng chỉ được xoá khi thanh toán thực sự thành công (xem trang
          // payment/simulate và payment/momo-return).
          if (data.paymentUrl.startsWith("http")) {
            // URL ngoài (vd trang thanh toán MoMo thật) — router.push chỉ
            // dành cho điều hướng nội bộ Next.js.
            window.location.href = data.paymentUrl;
          } else {
            router.push(data.paymentUrl);
          }
        } else {
          // COD / chuyển khoản: đơn được xác nhận ngay, không có bước chờ
          // thanh toán online nên xoá giỏ hàng luôn.
          clearCart();
          router.push(`/orders/${orderNumber}?status=new`);
        }
      } else if (data.requireLogin) {
        router.push("/login?redirect=/checkout");
      } else {
        alert(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !customer) {
    return <div className="min-h-[70vh] flex items-center justify-center pt-28">Đang tải...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Không có sản phẩm</h1>
        <p className="text-muted-foreground mb-8">Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.</p>
        <Link href="/products" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Đặt hàng</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold text-foreground mb-5">Thông tin giao hàng</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Họ và tên *</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Số điện thoại *</label>
                <input type="tel" name="phone" required value={form.phone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Công ty</label>
                <input type="text" name="company" value={form.company} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Địa chỉ giao hàng *</label>
                <textarea name="address" required rows={3} value={form.address} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Ghi chú</label>
                <textarea name="note" rows={2} value={form.note} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold text-foreground mb-5">Phương thức thanh toán</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = form.paymentMethod === method.value;
                return (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${
                      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground text-sm">{method.label}</span>
                      <span className="block text-xs text-muted-foreground truncate">{method.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-28 bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-semibold text-foreground mb-4">Đơn hàng ({items.length} sản phẩm)</h2>
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground truncate">
                  {item.name} <span className="text-foreground">×{item.quantity}</span>
                </span>
                <span className="text-foreground tabular-nums shrink-0">
                  {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border my-4" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="font-semibold text-foreground">Tổng cộng</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {totalPrice().toLocaleString("vi-VN")} đ
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
