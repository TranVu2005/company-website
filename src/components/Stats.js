import { getStats } from '../services/api.js';
import { animateCounter } from '../utils/animations.js';

export default async function Stats() {
  const stats = await getStats();
  
  const statsHtml = stats.map((stat, index) => {
    return `
      <div class="stat-item reveal delay-${(index + 1) * 100}">
        <div class="stat-value-wrapper">
          <span class="stat-value" data-target="${stat.value}">0</span>
          <span class="stat-suffix">${stat.suffix}</span>
        </div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `;
  }).join('');

  const template = `
    <section class="stats-section">
      <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1470&auto=format&fit=crop" class="stats-bg-image" alt="Background" loading="lazy"/>
      <div class="container stats-container">
        <div class="grid grid-4">
          ${statsHtml}
        </div>
      </div>
    </section>
  `;

  // Attach counter animation
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counters = entry.target.querySelectorAll('.stat-value');
          counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            animateCounter(counter, target, 2500);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    const section = document.querySelector('.stats-section');
    if (section) observer.observe(section);
  }, 100);

  return template;
}
