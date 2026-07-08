import Link from "next/link";
import { getCompanyInfo } from "@/lib/data";
import BackToTop from "./BackToTop";
import NewsletterForm from "./NewsletterForm";

export default async function Footer() {
  const company = await getCompanyInfo();

  return (
    <footer className="footer" id="footer-root">
      <img
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1469&auto=format&fit=crop"
        alt="Workspace"
        className="footer-bg"
        loading="lazy"
      />

      <div className="container footer-container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="footer-logo">
              Nova<span>Tech</span>
            </Link>
            <p className="footer-desc">{company.description}</p>
          </div>

          <div>
            <h4 className="footer-heading">Công Ty</h4>
            <div className="footer-links">
              <Link href="/#about-root" className="footer-link">
                Giới thiệu
              </Link>
              <Link href="/#team-root" className="footer-link">
                Đội ngũ
              </Link>
              <Link href="/#clients-root" className="footer-link">
                Khách hàng
              </Link>
              <Link href="/#news-root" className="footer-link">
                Tin tức
              </Link>
              <Link href="/chinh-sach" className="footer-link">
                Chính sách &amp; Điều khoản
              </Link>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Giải Pháp</h4>
            <div className="footer-links">
              <Link href="/#services-root" className="footer-link">
                Dịch vụ MarTech
              </Link>
              <Link href="/#products-root" className="footer-link">
                Sản phẩm phần mềm
              </Link>
              <a href="#" className="footer-link">
                Tư vấn chiến lược
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Đăng Ký Nhận Tin</h4>
            <p className="footer-desc" style={{ marginBottom: "0.5rem" }}>
              Nhận thông tin cập nhật mới nhất về thị trường và công nghệ.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            &copy; {new Date().getFullYear()} {company.name}. All rights
            reserved.
          </div>
          <div className="team-socials">
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

      <BackToTop />
    </footer>
  );
}
