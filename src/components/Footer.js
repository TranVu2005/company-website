import { getCompanyInfo } from '../services/api.js';

export default async function Footer() {
  const company = await getCompanyInfo();
  
  const template = `
    <footer class="footer">
      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1469&auto=format&fit=crop" alt="Workspace" class="footer-bg" loading="lazy" />
      
      <div class="container footer-container">
        <div class="footer-grid">
          <div>
            <a href="#" class="footer-logo">Nova<span>Tech</span></a>
            <p class="footer-desc">${company.description}</p>
          </div>
          
          <div>
            <h4 class="footer-heading">Công Ty</h4>
            <div class="footer-links">
              <a href="#about-root" class="footer-link">Giới thiệu</a>
              <a href="#team-root" class="footer-link">Đội ngũ</a>
              <a href="#clients-root" class="footer-link">Khách hàng</a>
              <a href="#news-root" class="footer-link">Tin tức</a>
            </div>
          </div>
          
          <div>
            <h4 class="footer-heading">Giải Pháp</h4>
            <div class="footer-links">
              <a href="#services-root" class="footer-link">Dịch vụ MarTech</a>
              <a href="#products-root" class="footer-link">Sản phẩm phần mềm</a>
              <a href="#" class="footer-link">Tư vấn chiến lược</a>
            </div>
          </div>
          
          <div>
            <h4 class="footer-heading">Đăng Ký Nhận Tin</h4>
            <p class="footer-desc" style="margin-bottom: 0.5rem">Nhận thông tin cập nhật mới nhất về thị trường và công nghệ.</p>
            <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Cảm ơn bạn đã đăng ký!');">
              <input type="email" placeholder="Email của bạn" class="newsletter-input" required>
              <button type="submit" class="newsletter-btn">Gửi</button>
            </form>
          </div>
        </div>
        
        <div class="footer-bottom">
          <div class="copyright">
            &copy; ${new Date().getFullYear()} ${company.name}. All rights reserved.
          </div>
          <div class="team-socials">
            <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">FB</a>
            <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">IN</a>
            <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">TW</a>
          </div>
        </div>
      </div>
      
      <a href="#" class="back-to-top" id="back-to-top" aria-label="Lên đầu trang">↑</a>
    </footer>
  `;

  // Attach back to top functionality
  setTimeout(() => {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      });
      
      backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }, 100);

  return template;
}
