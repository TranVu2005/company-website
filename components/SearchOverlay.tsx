"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearch } from "./SearchContext";
import { searchData } from "@/app/actions/search";
import type { SearchResult } from "@/lib/types";

// Ánh xạ loại kết quả -> đường dẫn route động
const SECTION_PATH: Record<SearchResult["section"], string> = {
  service: "services",
  product: "products",
  news: "news",
};

export default function SearchOverlay() {
  const { isOpen, close } = useSearch();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Khoá scroll body + focus input khi mở; đóng bằng Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Tìm kiếm debounce 300ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setResults(await searchData(query));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className={`search-overlay${isOpen ? " active" : ""}`} id="search-overlay">
      <div className="search-header">
        <button className="close-search" onClick={close} aria-label="Close search">
          &times;
        </button>
      </div>
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Nhập từ khóa tìm kiếm..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-results" id="search-results">
          {query.trim() && results.length === 0 ? (
            <div className="no-results">Không tìm thấy kết quả nào.</div>
          ) : (
            results.map((item) => (
              <Link
                key={`${item.section}-${item.id}`}
                href={`/${SECTION_PATH[item.section]}/${item.id}`}
                className="search-result-item"
                onClick={close}
              >
                <span className="result-type">{item.type}</span>
                <h4 className="result-title">{item.title}</h4>
                <p className="result-desc">{item.desc}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
