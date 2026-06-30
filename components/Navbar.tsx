"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useSearch } from "./SearchContext";

const NAV_ITEMS = [
  { id: "hero-root", label: "Trang chủ" },
  { id: "about-root", label: "Giới thiệu" },
  { id: "services-root", label: "Dịch vụ" },
  { id: "products-root", label: "Sản phẩm" },
  { id: "team-root", label: "Đội ngũ" },
  { id: "news-root", label: "Tin tức" },
  { id: "contact-root", label: "Liên hệ" },
];

export default function Navbar() {
  const { open } = useSearch();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("hero-root");
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Di chuyển thanh indicator tới link đang active
  const moveIndicator = () => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const link = nav.querySelector<HTMLAnchorElement>(".nav-link.active");
    if (!link) return;
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.left = `${linkRect.left - navRect.left}px`;
  };

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((i) => i.id);
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      let current = "hero-root";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", moveIndicator);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", moveIndicator);
    };
  }, []);

  // Cập nhật indicator khi active thay đổi
  useEffect(() => {
    moveIndicator();
  }, [active]);

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`} id="navbar">
      <div className="container nav-container">
        <Link href="/" className="logo">
          Nova<span>Tech</span>
        </Link>

        <nav
          ref={navRef}
          className={`nav-links${mobileOpen ? " active" : ""}`}
          id="nav-links"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`/#${item.id}`}
              className={`nav-link${active === item.id ? " active" : ""}`}
              data-section={item.id}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <span className="nav-indicator" id="nav-indicator" ref={indicatorRef} />
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" onClick={open} aria-label="Search">
            <Search width={18} height={18} />
          </button>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
