"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCustomerAuth();
  const redirect = searchParams.get("redirect") || "/account";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Email hoặc mật khẩu không đúng.");
        return;
      }

      await refresh();
      router.push(redirect);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Đăng nhập</h1>
      <p className="text-muted-foreground mb-8">Đăng nhập để đặt hàng và xem lịch sử đơn hàng.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-card rounded-xl border border-border shadow-sm p-6">
        {error && (
          <div className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass.replace("mb-1.5", "")}>Mật khẩu *</label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <input type="password" name="password" required value={form.password} onChange={handleChange} className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          Chưa có tài khoản?{" "}
          <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline font-medium">
            Tạo tài khoản
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
