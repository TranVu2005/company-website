"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User } from "lucide-react";
import { useSearch } from "./SearchContext";
import { useCartStore } from "@/lib/cart-store";
import { useCustomerAuth } from "./CustomerAuthContext";

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
  const pathname = usePathname();
  // Chỉ trang chủ có Hero nền tối trải dài dưới navbar trong suốt — mọi
  // trang khác nền trắng nên phải luôn hiện nền tối cho navbar để không
  // bị "mất hút" (chữ trắng trên nền trắng).
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("hero-root");
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const { customer, loading: authLoading } = useCustomerAuth();

  // Chỉ đọc giỏ hàng (localStorage) sau khi đã mount ở client để tránh
  // lệch nội dung giữa SSR và client (hydration mismatch).
  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className={`navbar${scrolled || !isHome ? " scrolled" : ""}`} id="navbar">
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
          {mounted && !authLoading && (
            <Link
              href={customer ? "/account" : "/login"}
              className="icon-btn"
              aria-label={customer ? "Tài khoản" : "Đăng nhập"}
            >
              <User width={18} height={18} />
            </Link>
          )}
          <Link
            href="/cart"
            className="icon-btn"
            aria-label="Giỏ hàng"
            style={{ position: "relative" }}
          >
            <ShoppingCart width={18} height={18} />
            {mounted && totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--accent-primary, #e63946)",
                  color: "#fff",
                  borderRadius: "9999px",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  minWidth: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>
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
