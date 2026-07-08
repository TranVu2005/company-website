"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCustomerAuth();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 pt-28 pb-16 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Liên kết không hợp lệ</h1>
        <p className="text-muted-foreground mb-8">Thiếu mã đặt lại mật khẩu. Vui lòng yêu cầu lại liên kết mới.</p>
        <Link href="/forgot-password" className="text-primary hover:underline font-medium">
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: form.password }),
      });

      if (!res.ok) {
        setError("Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.");
        return;
      }

      await refresh();
      router.push("/account");
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Đặt lại mật khẩu</h1>
      <p className="text-muted-foreground mb-8">Nhập mật khẩu mới cho tài khoản của bạn.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-card rounded-xl border border-border shadow-sm p-6">
        {error && (
          <div className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}
        <div>
          <label className={labelClass}>Mật khẩu mới *</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Xác nhận mật khẩu mới *</label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
