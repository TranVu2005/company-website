// Kiểu dữ liệu dùng chung — nguồn duy nhất (single source of truth).
// Hình dạng khớp với model Payload CMS. Module này KHÔNG import code server,
// nên an toàn để dùng ở cả Server Component lẫn Client Component.
//
// Quy ước: trường `id` đã được tầng dữ liệu (lib/data.ts) ánh xạ = `slug`
// (mã định danh dùng cho URL, vd "s1", "p1", "n1"), còn `slug` giữ nguyên.

export interface Technology {
  techId: string;
  name: string;
  description: string;
  icon: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  technologies: Technology[];
  contact: ContactInfo;
  socials: SocialLink[];
}

export interface Feature {
  feature: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  details: string;
  features: Feature[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  details: string;
  features: Feature[];
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface Stat {
  id: string;
  slug: string;
  value: number;
  label: string;
  suffix: string;
  order: number;
}

export interface Client {
  id: string;
  slug: string;
  name: string;
  logo: string;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  thumbnail: string;
  content: string;
}

export interface SearchResult {
  type: string;
  title: string;
  desc: string;
  section: "service" | "product" | "news";
  id: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  shippingAddress: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee?: number;
  total: number;
  status: "pending" | "paid" | "processing" | "shipping" | "delivered" | "cancelled";
  paymentMethod?: "vnpay" | "momo" | "zalopay" | "bank_transfer" | "cod";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  paymentTransactionId?: string;
  gatewayRef?: string;
  createdAt: string;
  updatedAt: string;
}
