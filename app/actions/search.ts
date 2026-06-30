"use server";

/**
 * Server action tìm kiếm — gọi được từ Client Component (SearchOverlay).
 * Lọc dữ liệu lấy từ Payload qua tầng data (lib/data.ts, server-only).
 */
import { getServices, getProducts, getNews } from "@/lib/data";
import type { SearchResult } from "@/lib/types";

export async function searchData(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return [];

  const [services, products, news] = await Promise.all([
    getServices(),
    getProducts(),
    getNews(),
  ]);

  const results: SearchResult[] = [];

  services.forEach((s) => {
    if (
      s.title.toLowerCase().includes(query) ||
      (s.description ?? "").toLowerCase().includes(query)
    ) {
      results.push({
        type: "Dịch vụ",
        title: s.title,
        desc: s.description,
        section: "service",
        id: s.id,
      });
    }
  });

  products.forEach((p) => {
    if (
      p.name.toLowerCase().includes(query) ||
      (p.tagline ?? "").toLowerCase().includes(query)
    ) {
      results.push({
        type: "Sản phẩm",
        title: p.name,
        desc: p.tagline,
        section: "product",
        id: p.id,
      });
    }
  });

  news.forEach((n) => {
    if (
      n.title.toLowerCase().includes(query) ||
      (n.excerpt ?? "").toLowerCase().includes(query)
    ) {
      results.push({
        type: "Tin tức",
        title: n.title,
        desc: n.excerpt,
        section: "news",
        id: n.id,
      });
    }
  });

  return results;
}
