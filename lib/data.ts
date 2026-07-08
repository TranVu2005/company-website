/**
 * Data Access Layer
 *
 * Giai đoạn 1: đọc dữ liệu từ Payload CMS (Postgres) thay cho JSON tĩnh.
 * Giữ nguyên chữ ký các hàm getter để UI không phải đổi.
 *
 * Quy ước ánh xạ: mỗi document trả về có `id` được gán = `slug`
 * (mã định danh dùng cho URL, vd "s1"), nhờ đó toàn bộ component/route
 * đang dùng `.id` để dựng link vẫn hoạt động như cũ.
 *
 * Module này chỉ chạy ở phía server (gọi DB). KHÔNG import từ Client Component;
 * phần tìm kiếm cho client nằm ở app/actions/search.ts (server action).
 */
import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type {
  CompanyInfo,
  Service,
  Product,
  TeamMember,
  Stat,
  Client,
  NewsItem,
} from "./types";

// Tái xuất kiểu để code cũ `import { X } from "@/lib/data"` (nếu có) vẫn chạy.
export type {
  Technology,
  ContactInfo,
  SocialLink,
  CompanyInfo,
  Service,
  Product,
  TeamMember,
  Stat,
  Client,
  NewsItem,
  SearchResult,
} from "./types";

// Một instance Payload cho mỗi request (cache của React dedupe trong 1 lần render).
const getClient = cache(async () => getPayload({ config }));

// Gán id = slug để giữ tương thích với các link đang dùng `.id`.
function withSlugId(doc: Record<string, unknown>) {
  return { ...doc, id: doc.slug };
}

export const getCompanyInfo = cache(async (): Promise<CompanyInfo> => {
  const payload = await getClient();
  const company = await payload.findGlobal({ slug: "company" });
  return company as unknown as CompanyInfo;
});

export const getServices = cache(async (): Promise<Service[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "services", limit: 100, sort: "slug" });
  return docs.map((d) => withSlugId(d)) as unknown as Service[];
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "products", limit: 100, sort: "slug" });
  return docs.map((d) => withSlugId(d)) as unknown as Product[];
});

export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "team", limit: 100, sort: "slug" });
  return docs.map((d) => withSlugId(d)) as unknown as TeamMember[];
});

export const getStats = cache(async (): Promise<Stat[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "stats", limit: 100, sort: "order" });
  return docs.map((d) => withSlugId(d)) as unknown as Stat[];
});

export const getClients = cache(async (): Promise<Client[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "clients", limit: 100, sort: "slug" });
  return docs.map((d) => withSlugId(d)) as unknown as Client[];
});

export const getNews = cache(async (): Promise<NewsItem[]> => {
  const payload = await getClient();
  const { docs } = await payload.find({ collection: "news", limit: 100, sort: "-date" });
  return docs.map((d) => withSlugId(d)) as unknown as NewsItem[];
});

async function findBySlug(collection: string, slug: string) {
  const payload = await getClient();
  const { docs } = await payload.find({
    collection: collection as never,
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return docs[0];
}

export const getServiceById = cache(async (id: string): Promise<Service | undefined> => {
  const doc = await findBySlug("services", id);
  return doc ? (withSlugId(doc) as unknown as Service) : undefined;
});

export const getProductById = cache(async (id: string): Promise<Product | undefined> => {
  const doc = await findBySlug("products", id);
  return doc ? (withSlugId(doc) as unknown as Product) : undefined;
});

export const getNewsById = cache(async (id: string): Promise<NewsItem | undefined> => {
  const doc = await findBySlug("news", id);
  return doc ? (withSlugId(doc) as unknown as NewsItem) : undefined;
});
