import { getNews } from '../services/api.js';
export default async function News() {
  const news = await getNews();
  
  const newsHtml = news.map((item, index) => {
    return `
      <article class="news-card reveal delay-${(index + 1) * 100}">
        <div class="news-thumbnail">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy"/>
        </div>
        <div class="news-content">
          <span class="news-date">${item.date}</span>
          <h3 class="news-title"><a href="#/news/${item.id}">${item.title}</a></h3>
          <p class="news-excerpt">${item.excerpt}</p>
          <a href="#/news/${item.id}" class="news-link">Đọc tiếp</a>
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="news-section">
      <div class="container">
        <div class="flex justify-between items-center" style="margin-bottom: 3rem;">
          <div class="reveal">
            <span class="section-subtitle">Tin Tức & Sự Kiện</span>
            <h2 class="section-title" style="margin-bottom: 0;">Cập Nhật Mới Nhất</h2>
          </div>
          <a href="#" class="btn btn-outline reveal delay-200">Xem tất cả bài viết</a>
        </div>
        
        <div class="grid grid-3">
          ${newsHtml}
        </div>
      </div>
    </section>
  `;
}
