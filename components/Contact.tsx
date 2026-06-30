import { getCompanyInfo } from "@/lib/data";
import ContactForm from "./ContactForm";

export default async function Contact() {
  const company = await getCompanyInfo();

  return (
    <section className="contact-section" id="contact-root">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-form-wrapper reveal-left">
            <span className="section-subtitle">Liên Hệ</span>
            <h2 className="section-title" style={{ textAlign: "left" }}>
              Sẵn sàng hợp tác cùng NovaTech?
            </h2>
            <ContactForm />
          </div>

          <div className="contact-info reveal-right delay-200">
            <div className="contact-blob" />
            <h3>Thông tin liên hệ</h3>

            <div className="info-item">
              <div className="info-icon">📍</div>
              <div className="info-text">
                <h4>Trụ sở chính</h4>
                <p>{company.contact.address}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📞</div>
              <div className="info-text">
                <h4>Hotline 24/7</h4>
                <p>{company.contact.phone}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">✉️</div>
              <div className="info-text">
                <h4>Email</h4>
                <p>{company.contact.email}</p>
              </div>
            </div>

            <div style={{ marginTop: "3rem" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1rem" }}>
                Kết nối với chúng tôi:
              </p>
              <div className="team-socials" style={{ justifyContent: "flex-start" }}>
                <a
                  href="#"
                  className="social-icon"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  FB
                </a>
                <a
                  href="#"
                  className="social-icon"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  IN
                </a>
                <a
                  href="#"
                  className="social-icon"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  TW
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          className="map-wrapper reveal slide-up delay-200"
          style={{ marginTop: "4rem" }}
        >
          <iframe
            title="Bản đồ NovaTech"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2789124443834!2d106.700142615334!3d10.790014392311497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528b4a0376189%3A0x6d90a98b25be9154!2sLandmark%2081!5e0!3m2!1sen!2s!4v1655000000000!5m2!1sen!2s"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: "16px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
