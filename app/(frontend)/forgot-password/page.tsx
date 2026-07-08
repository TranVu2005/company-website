"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/customers/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Luôn hiện thông báo thành công dù email có tồn tại hay không, tránh
      // lộ ra ngoài việc email nào đã đăng ký tài khoản.
      setSubmitted(true);
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 pt-28 pb-16 text-center">
        <MailCheck className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Kiểm tra email của bạn</h1>
        <p className="text-muted-foreground mb-8">
          Nếu <span className="font-medium text-foreground">{email}</span> đã đăng ký tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.
        </p>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Quên mật khẩu</h1>
      <p className="text-muted-foreground mb-8">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-card rounded-xl border border-border shadow-sm p-6">
        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
