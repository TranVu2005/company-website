"use client";

import { useEffect, useRef } from "react";
import type { Stat } from "@/lib/types";

// Animation đếm số (kế thừa animateCounter từ utils/animations.js)
function animateCounter(el: HTMLElement, target: number, duration = 2500) {
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = progress * (2 - progress); // easeOutQuad
    el.innerText = String(Math.floor(eased * target));
    if (progress < 1) requestAnimationFrame(step);
    else el.innerText = String(target);
  };
  requestAnimationFrame(step);
}

export default function Stats({ stats }: { stats: Stat[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section
              .querySelectorAll<HTMLElement>(".stat-value")
              .forEach((el) => {
                const target = parseInt(el.dataset.target || "0", 10);
                animateCounter(el, target);
              });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section" id="stats-root" ref={sectionRef}>
      <img
        src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1470&auto=format&fit=crop"
        className="stats-bg-image"
        alt="Background"
        loading="lazy"
      />
      <div className="container stats-container">
        <div className="grid grid-4">
          {stats.map((stat, index) => (
            <div key={stat.id} className={`stat-item reveal delay-${(index + 1) * 100}`}>
              <div className="stat-value-wrapper">
                <span className="stat-value" data-target={stat.value}>
                  0
                </span>
                <span className="stat-suffix">{stat.suffix}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
