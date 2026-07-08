// Cấu hình site dùng chung cho SEO/metadata.
// Đặt NEXT_PUBLIC_SITE_URL trong .env khi deploy (vd: https://novatech.vn).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://novatech.demo"
).replace(/\/$/, "");

export const SITE_NAME = "NovaTech Solutions";
export const SITE_DESCRIPTION =
  "NovaTech cung cấp giải pháp Marketing Technology toàn diện: AI, Big Data, Machine Learning, NLP.";
