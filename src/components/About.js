import { getCompanyInfo } from '../services/api.js';

export default async function About() {
  const company = await getCompanyInfo();
  
  const techCardsHtml = company.technologies.map((tech, index) => `
    <div class="tech-card reveal delay-${(index + 1) * 100}">
      <div class="tech-icon"><i data-lucide="${tech.icon}"></i></div>
      <h3 class="tech-title">${tech.name}</h3>
      <p class="tech-desc">${tech.description}</p>
    </div>
  `).join('');

  const template = `
    <section class="about-section">
      <div class="container">
        <div class="about-content reveal">
          <span class="section-subtitle">Về Chúng Tôi</span>
          <h2 class="section-title" style="margin-bottom: 1.5rem">Giới thiệu NovaTech</h2>
          <p class="text-body">${company.description}</p>
        </div>
        
        <div class="tech-grid">
          ${techCardsHtml}
        </div>
      </div>
    </section>
  `;

  return template;
}
