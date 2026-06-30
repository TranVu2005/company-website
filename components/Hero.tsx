"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const TYPING_TEXT =
  "Áp dụng các công nghệ mới nhất trong phát triển giải pháp như: Phân tích dữ liệu lớn (Big Data), Trí tuệ nhân tạo (AI), Học máy (Machine Learning) và Xử lý ngôn ngữ tự nhiên (NLP).";

export default function Hero() {
  const typingRef = useRef<HTMLParagraphElement>(null);

  // Hiệu ứng typewriter (kế thừa typeWriter() từ utils/animations.js)
  useEffect(() => {
    const el = typingRef.current;
    if (!el) return;
    el.innerHTML = "";
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const type = () => {
      if (i < TYPING_TEXT.length) {
        el.innerHTML += TYPING_TEXT.charAt(i);
        i++;
        timer = setTimeout(type, 40);
      } else {
        el.innerHTML += '<span class="typing-cursor"></span>';
      }
    };
    type();
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hero-section" id="hero-root" suppressHydrationWarning>
      <img
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
        alt="Technology Background"
        className="hero-bg-image"
      />
      <div className="hero-overlay" />
      <div className="blob hero-blob" />

      <div className="container hero-content-wrapper">
        <div className="hero-grid">
          <div className="hero-text reveal-left">
            <h1 className="hero-title">
              Giải pháp{" "}
              <span className="text-gradient">Marketing Technology</span> toàn
              diện
            </h1>
            <p className="hero-tagline" ref={typingRef} />

            <div className="hero-actions">
              <Link href="/#services-root" className="btn btn-primary">
                Khám phá dịch vụ
              </Link>
              <Link
                href="/#contact-root"
                className="btn btn-outline"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
              >
                Liên hệ ngay
              </Link>
            </div>
          </div>

          <div className="hero-visual reveal-right delay-200">
            <div className="hero-mockup">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop"
                alt="Data Analytics Dashboard"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
