import { getServices } from '../services/api.js';

export default async function ServiceDetail(id) {
  const services = await getServices();
  const service = services.find(s => s.id === id);

  if (!service) {
    return `
      <div class="container" style="padding: 8rem 0; text-align: center;">
        <h2>Không tìm thấy dịch vụ</h2>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Quay lại trang chủ</a>
      </div>
    `;
  }

  const featuresHtml = service.features ? service.features.map(f => `<li><i data-lucide="check-circle" style="color: var(--accent-primary); margin-right: 0.5rem; width: 20px;"></i> ${f}</li>`).join('') : '';

  return `
    <div class="detail-page">
      <div class="detail-hero reveal">
        <div class="container text-center">
          <div class="detail-icon"><i data-lucide="${service.icon}" style="width: 64px; height: 64px;"></i></div>
          <h1 class="detail-title">${service.title}</h1>
          <p class="detail-subtitle">${service.description}</p>
        </div>
      </div>
      
      <div class="container detail-content reveal delay-200">
        <div class="grid grid-2" style="align-items: start;">
          <div class="detail-text">
            <h3>Tổng quan dịch vụ</h3>
            <p>${service.details}</p>
            <div style="margin-top: 2rem;">
              <a href="#/" class="btn btn-outline">← Quay lại trang chủ</a>
              <a href="#contact-root" class="btn btn-primary" style="margin-left: 1rem;" onclick="window.location.hash='#/'; setTimeout(() => document.getElementById('contact-root').scrollIntoView(), 100);">Nhận tư vấn ngay</a>
            </div>
          </div>
          <div class="detail-features card">
            <h3>Giá trị mang lại</h3>
            <ul class="feature-list" style="list-style: none; padding: 0;">
              ${featuresHtml}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}
