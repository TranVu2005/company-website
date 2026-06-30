"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      className="newsletter-form"
      onSubmit={(e) => {
        e.preventDefault();
        // Giai đoạn 1: gọi Server Action lưu danh sách đăng ký nhận tin.
        setDone(true);
        setEmail("");
        setTimeout(() => setDone(false), 4000);
      }}
    >
      <input
        type="email"
        placeholder="Email của bạn"
        className="newsletter-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="newsletter-btn">
        {done ? "✓" : "Gửi"}
      </button>
    </form>
  );
}
