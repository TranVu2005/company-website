"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCustomerAuth();
  const redirect = searchParams.get("redirect") || "/account";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      const createRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.errors?.[0]?.message || "Không thể tạo tài khoản. Email có thể đã được sử dụng.");
        return;
      }

      // Đăng ký xong tự đăng nhập luôn để không bắt khách nhập lại mật khẩu.
      const loginRes = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!loginRes.ok) {
        router.push("/login");
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
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Tạo tài khoản</h1>
      <p className="text-muted-foreground mb-8">Tạo tài khoản để đặt hàng và theo dõi đơn hàng của bạn.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-card rounded-xl border border-border shadow-sm p-6">
        {error && (
          <div className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}
        <div>
          <label className={labelClass}>Họ và tên *</label>
          <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Số điện thoại</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mật khẩu *</label>
          <input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Xác nhận mật khẩu *</label>
          <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange} className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          Đã có tài khoản?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
