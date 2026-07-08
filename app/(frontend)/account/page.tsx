"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, LogOut } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export default function AccountPage() {
  const router = useRouter();
  const { customer, loading, logout, refresh } = useCustomerAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !customer) {
      router.push("/login?redirect=/account");
    }
  }, [loading, customer, router]);

  useEffect(() => {
    if (customer) {
      setProfileForm({ name: customer.name || "", phone: customer.phone || "" });
    }
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    fetch("/api/orders/mine", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setOrdersLoading(false));
  }, [customer]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setProfileMessage(null);
    setProfileSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
      });
      if (!res.ok) {
        setProfileMessage({ type: "error", text: "Không thể cập nhật thông tin, vui lòng thử lại." });
        return;
      }
      await refresh();
      setProfileMessage({ type: "success", text: "Đã cập nhật thông tin tài khoản." });
    } catch {
      setProfileMessage({ type: "error", text: "Có lỗi xảy ra, vui lòng thử lại." });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự." });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch("/api/customers/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ type: "error", text: data.message || "Không thể đổi mật khẩu." });
        return;
      }
      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPasswordMessage({ type: "error", text: "Có lỗi xảy ra, vui lòng thử lại." });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading || !customer) {
    return <div className="min-h-[70vh] flex items-center justify-center pt-28">Đang tải...</div>;
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Tài khoản của tôi</h1>
          <p className="text-muted-foreground">{customer.name} · {customer.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>

      <section className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Thông tin tài khoản</h2>
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          {profileMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm ${profileMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {profileMessage.text}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Họ tên *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={customer.email} disabled className={`${inputClass} bg-secondary text-muted-foreground cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelClass}>Số điện thoại</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={profileSubmitting}
            className="self-start px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </section>

      <section className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Đổi mật khẩu</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          {passwordMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm ${passwordMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {passwordMessage.text}
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Mật khẩu hiện tại *</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mật khẩu mới *</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={passwordSubmitting}
            className="self-start px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </section>

      <section className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h2 className="font-semibold text-foreground mb-4">Đơn hàng của tôi</h2>

        {ordersLoading && <p className="text-muted-foreground text-sm">Đang tải...</p>}

        {!ordersLoading && orders.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link href="/products" className="text-primary hover:underline font-medium">
              Mua sắm ngay
            </Link>
          </div>
        )}

        {!ordersLoading && orders.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.orderNumber}`}
                className="flex items-center justify-between py-4 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")} · {STATUS_LABELS[order.status] || order.status}
                  </p>
                </div>
                <p className="font-semibold text-primary tabular-nums">
                  {order.total.toLocaleString("vi-VN")} đ
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
