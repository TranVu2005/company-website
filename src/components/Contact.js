import { getCompanyInfo, submitContact } from '../services/api.js';
export default async function Contact() {
  const company = await getCompanyInfo();
  
  const template = `
    <section class="contact-section">
      <div class="container">
        <div class="contact-grid">
          
          <div class="contact-form-wrapper reveal-left">
            <span class="section-subtitle">Liên Hệ</span>
            <h2 class="section-title" style="text-align: left;">Sẵn sàng hợp tác cùng NovaTech?</h2>
            
            <form id="contact-form">
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label" for="name">Họ và tên *</label>
                  <input type="text" id="name" name="name" class="form-control" required placeholder="Nhập họ tên của bạn">
                </div>
                <div class="form-group">
                  <label class="form-label" for="phone">Số điện thoại *</label>
                  <input type="tel" id="phone" name="phone" class="form-control" required placeholder="Nhập số điện thoại">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="email">Email *</label>
                <input type="email" id="email" name="email" class="form-control" required placeholder="Nhập địa chỉ email">
              </div>
              
              <div class="form-group">
                <label class="form-label" for="message">Nội dung *</label>
                <textarea id="message" name="message" class="form-control" required placeholder="Bạn cần chúng tôi tư vấn gì?"></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary" id="submit-btn" style="width: 100%">Gửi yêu cầu</button>
              
              <div id="form-status" class="form-status"></div>
            </form>
          </div>
          
          <div class="contact-info reveal-right delay-200">
            <div class="contact-blob"></div>
            <h3>Thông tin liên hệ</h3>
            
            <div class="info-item">
              <div class="info-icon">📍</div>
              <div class="info-text">
                <h4>Trụ sở chính</h4>
                <p>${company.contact.address}</p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">📞</div>
              <div class="info-text">
                <h4>Hotline 24/7</h4>
                <p>${company.contact.phone}</p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">✉️</div>
              <div class="info-text">
                <h4>Email</h4>
                <p>${company.contact.email}</p>
              </div>
            </div>
            
            <div style="margin-top: 3rem;">
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">Kết nối với chúng tôi:</p>
              <div class="team-socials" style="justify-content: flex-start;">
                <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">FB</a>
                <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">IN</a>
                <a href="#" class="social-icon" style="background: rgba(255,255,255,0.1); color: white;">TW</a>
              </div>
            </div>
          </div>
          
        </div>
        
        <div class="map-wrapper reveal slide-up delay-200" style="margin-top: 4rem;">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2789124443834!2d106.700142615334!3d10.790014392311497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528b4a0376189%3A0x6d90a98b25be9154!2sLandmark%2081!5e0!3m2!1sen!2s!4v1655000000000!5m2!1sen!2s" 
            width="100%" 
            height="400" 
            style="border:0; border-radius: 16px;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </section>
  `;

  // Attach form logic
  setTimeout(() => {
    const form = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Basic validation
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        submitBtn.innerHTML = 'Đang gửi...';
        submitBtn.disabled = true;
        
        try {
          const response = await submitContact(data);
          statusDiv.className = 'form-status success';
          statusDiv.innerText = response.message;
          form.reset();
        } catch (error) {
          statusDiv.className = 'form-status error';
          statusDiv.innerText = 'Có lỗi xảy ra, vui lòng thử lại sau.';
        } finally {
          submitBtn.innerHTML = 'Gửi yêu cầu';
          submitBtn.disabled = false;
          
          setTimeout(() => {
            statusDiv.className = 'form-status';
          }, 5000);
        }
      });
    }
  }, 100);

  return template;
}
