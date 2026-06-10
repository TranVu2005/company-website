import { getProducts } from '../services/api.js';

export default async function ProductDetail(id) {
  const products = await getProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    return `
      <div class="container" style="padding: 8rem 0; text-align: center;">
        <h2>Không tìm thấy sản phẩm</h2>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Quay lại trang chủ</a>
      </div>
    `;
  }

  const featuresHtml = product.features.map(f => `<li><i data-lucide="check" style="color: var(--accent-primary); margin-right: 0.5rem; width: 20px;"></i> ${f}</li>`).join('');

  return `
    <div class="detail-page">
      <div class="detail-hero reveal">
        <div class="container text-center">
          <span class="section-subtitle">Sản phẩm phần mềm</span>
          <h1 class="detail-title">${product.name}</h1>
          <p class="detail-subtitle">${product.tagline}</p>
        </div>
      </div>
      
      <div class="container detail-content reveal delay-200">
        <div class="product-row" style="margin-top: 0;">
          <div class="product-content">
            <h3>Mô tả sản phẩm</h3>
            <p>${product.details}</p>
            <h3 style="margin-top: 2rem;">Tính năng nổi bật</h3>
            <ul class="product-features" style="margin-bottom: 2rem;">
              ${featuresHtml}
            </ul>
            <div style="margin-top: 2rem;">
              <a href="#/" class="btn btn-outline">← Quay lại</a>
              <a href="#contact-root" class="btn btn-primary" style="margin-left: 1rem;" onclick="window.location.hash='#/'; setTimeout(() => document.getElementById('contact-root').scrollIntoView(), 100);">Yêu cầu Demo</a>
            </div>
          </div>
          
          <div class="product-visual">
            <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-lg);" />
          </div>
        </div>
      </div>
    </div>
  `;
}
