"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Kế thừa initScrollAnimations() từ src/utils/animations.js.
 * Quan sát các phần tử .reveal/.reveal-left/.reveal-right và thêm class .active khi vào viewport.
 * Chạy lại mỗi khi đổi route để bắt các phần tử mới.
 */
export default function ScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.15 }
    );

    const els = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right"
    );
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
