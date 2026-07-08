import Link from "next/link";
import { getNews } from "@/lib/data";

export default async function News() {
  const news = await getNews();

  return (
    <section className="news-section" id="news-root">
      <div className="container">
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: "3rem" }}
        >
          <div className="reveal">
            <span className="section-subtitle">Tin Tức &amp; Sự Kiện</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              Cập Nhật Mới Nhất
            </h2>
          </div>
          <a href="#" className="btn btn-outline reveal delay-200">
            Xem tất cả bài viết
          </a>
        </div>

        <div className="grid grid-3">
          {news.map((item, index) => (
            <article key={item.id} className={`news-card reveal delay-${(index + 1) * 100}`}>
              <div className="news-thumbnail">
                <img src={item.thumbnail} alt={item.title} loading="lazy" />
              </div>
              <div className="news-content">
                <span className="news-date">{item.date}</span>
                <h3 className="news-title">
                  <Link href={`/news/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="news-excerpt">{item.excerpt}</p>
                <Link href={`/news/${item.id}`} className="news-link">
                  Đọc tiếp
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
