import { getNews } from '../services/api.js';

export default async function NewsDetail(id) {
  const newsList = await getNews();
  const news = newsList.find(n => n.id === id);

  if (!news) {
    return `
      <div class="container" style="padding: 8rem 0; text-align: center;">
        <h2>Không tìm thấy bài viết</h2>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Quay lại trang chủ</a>
      </div>
    `;
  }

  return `
    <div class="detail-page">
      <div class="container detail-content reveal" style="max-width: 800px; padding-top: 8rem;">
        <a href="#/" class="btn btn-outline" style="margin-bottom: 2rem; border: none; padding-left: 0;">← Quay lại tin tức</a>
        
        <span class="news-date" style="display: block; margin-bottom: 1rem; color: var(--accent-primary); font-weight: 600;">${news.date}</span>
        <h1 class="detail-title" style="text-align: left; font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 2rem;">${news.title}</h1>
        
        <img src="${news.thumbnail}" alt="${news.title}" style="width: 100%; border-radius: 12px; margin-bottom: 3rem; box-shadow: var(--shadow-md);" />
        
        <div class="news-article-content" style="font-size: 1.1rem; line-height: 1.8; color: var(--text-body);">
          <p style="font-size: 1.25rem; font-weight: 500; color: var(--text-dark); margin-bottom: 2rem;">${news.excerpt}</p>
          ${news.content}
        </div>
        
        <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
          <p style="margin-bottom: 1rem;">Chia sẻ bài viết này</p>
          <div class="team-socials" style="justify-content: center;">
            <a href="#" class="social-icon">FB</a>
            <a href="#" class="social-icon">IN</a>
            <a href="#" class="social-icon">TW</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
