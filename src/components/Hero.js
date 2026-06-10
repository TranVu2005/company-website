import { typeWriter } from '../utils/animations.js';

export default function Hero() {
  const template = `
    <section class="hero-section">
      <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" alt="Technology Background" class="hero-bg-image" />
      <div class="hero-overlay"></div>
      <div class="blob hero-blob"></div>
      
      <div class="container hero-content-wrapper">
        <div class="hero-grid">
          <div class="hero-text reveal-left">
            <h1 class="hero-title">
              Giải pháp <span class="text-gradient">Marketing Technology</span> toàn diện
            </h1>
            <p class="hero-tagline" id="hero-typing-text"></p>
            
            <div class="hero-actions">
              <a href="#services-root" class="btn btn-primary">Khám phá dịch vụ</a>
              <a href="#contact-root" class="btn btn-outline" style="color: white; border-color: rgba(255,255,255,0.3)">Liên hệ ngay</a>
            </div>
          </div>
          
          <div class="hero-visual reveal-right delay-200">
            <div class="hero-mockup">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop" alt="Data Analytics Dashboard" />
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  setTimeout(() => {
    const typingElement = document.getElementById('hero-typing-text');
    if (typingElement) {
      const textToType = "Áp dụng các công nghệ mới nhất trong phát triển giải pháp như: Phân tích dữ liệu lớn (Big Data), Trí tuệ nhân tạo (AI), Học máy (Machine Learning) và Xử lý ngôn ngữ tự nhiên (NLP).";
      typeWriter(typingElement, textToType, 40);
    }
  }, 100);

  return template;
}
