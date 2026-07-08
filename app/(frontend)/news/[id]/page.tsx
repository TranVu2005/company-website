import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNews, getNewsById } from "@/lib/data";

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((n) => ({ id: n.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getNewsById(id);
  if (!item) return { title: "Không tìm thấy bài viết" };
  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical: `/news/${item.id}` },
    openGraph: {
      type: "article",
      title: item.title,
      description: item.excerpt,
      images: [item.thumbnail],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getNewsById(id);
  if (!news) notFound();

  return (
    <main id="detail-content">
      <div className="detail-page">
        <div
          className="container detail-content reveal"
          style={{ maxWidth: "800px", paddingTop: "8rem" }}
        >
          <Link
            href="/#news-root"
            className="btn btn-outline"
            style={{ marginBottom: "2rem", border: "none", paddingLeft: 0 }}
          >
            ← Quay lại tin tức
          </Link>

          <span
            className="news-date"
            style={{
              display: "block",
              marginBottom: "1rem",
              color: "var(--accent-primary)",
              fontWeight: 600,
            }}
          >
            {news.date}
          </span>
          <h1
            className="detail-title"
            style={{
              textAlign: "left",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              marginBottom: "2rem",
            }}
          >
            {news.title}
          </h1>

          <img
            src={news.thumbnail}
            alt={news.title}
            style={{
              width: "100%",
              borderRadius: "12px",
              marginBottom: "3rem",
              boxShadow: "var(--shadow-md)",
            }}
          />

          <div
            className="news-article-content"
            style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-body)" }}
          >
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "var(--text-dark)",
                marginBottom: "2rem",
              }}
            >
              {news.excerpt}
            </p>
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>

          <div
            style={{
              marginTop: "4rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "1rem" }}>Chia sẻ bài viết này</p>
            <div className="team-socials" style={{ justifyContent: "center" }}>
              <a href="#" className="social-icon">
                FB
              </a>
              <a href="#" className="social-icon">
                IN
              </a>
              <a href="#" className="social-icon">
                TW
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
