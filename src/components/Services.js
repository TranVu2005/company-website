import { getServices } from '../services/api.js';

export default async function Services() {
  const services = await getServices();
  
  const servicesHtml = services.map((service, index) => {
    // Delay effect row by row
    const delay = (index % 3 + 1) * 100;
    
    return `
      <div class="service-card reveal delay-${delay}">
        <div class="service-icon"><i data-lucide="${service.icon}"></i></div>
        <h3 class="service-title">${service.title}</h3>
        <p class="service-desc">${service.description}</p>
        <a href="#/service/${service.id}" class="service-link">Xem chi tiết</a>
      </div>
    `;
  }).join('');

  const template = `
    <section class="services-section">
      <div class="blob services-blob"></div>
      <div class="container">
        <div class="reveal">
          <span class="section-subtitle text-center">Dịch Vụ & Giải Pháp</span>
          <h2 class="section-title">Dịch vụ của NovaTech</h2>
        </div>
        
        <div class="grid grid-3">
          ${servicesHtml}
        </div>
      </div>
    </section>
  `;

  return template;
}
