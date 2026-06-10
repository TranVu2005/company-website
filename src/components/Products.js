import { getProducts } from '../services/api.js';
export default async function Products() {
  const products = await getProducts();
  
  const productsHtml = products.map((product, index) => {
    const isEven = index % 2 !== 0;
    const revealClass = isEven ? 'reveal-right' : 'reveal-left';
    const visualRevealClass = isEven ? 'reveal-left' : 'reveal-right';
    
    const featuresHtml = product.features.map(f => `<li class="feature-item">${f}</li>`).join('');

    return `
      <div class="product-row">
        <div class="product-content ${revealClass}">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-tagline">${product.tagline}</p>
          <ul class="product-features">
            ${featuresHtml}
          </ul>
          <a href="#/product/${product.id}" class="btn btn-primary">Tìm hiểu thêm</a>
        </div>
        
        <div class="product-visual ${visualRevealClass}">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="products-section">
      <div class="blob products-blob"></div>
      <div class="container">
        <div class="reveal">
          <span class="section-subtitle text-center">Sản Phẩm Cốt Lõi</span>
          <h2 class="section-title">Hệ Sinh Thái Sản Phẩm</h2>
        </div>
        
        <div class="products-container">
          ${productsHtml}
        </div>
      </div>
    </section>
  `;
}
