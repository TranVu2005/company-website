import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getProducts, getServices, getNews } from "@/lib/data";
import { POLICIES } from "@/lib/legal";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, services, news] = await Promise.all([
    getProducts(),
    getServices(),
    getNews(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/chinh-sach`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const policyEntries: MetadataRoute.Sitemap = POLICIES.map((p) => ({
    url: `${SITE_URL}/chinh-sach/${p.slug}`,
    lastModified: new Date(p.updated),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${SITE_URL}/news/${n.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...policyEntries,
    ...productEntries,
    ...serviceEntries,
    ...newsEntries,
  ];
}
