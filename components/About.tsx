import { getCompanyInfo } from "@/lib/data";
import Icon from "./Icon";

export default async function About() {
  const company = await getCompanyInfo();

  return (
    <section className="about-section" id="about-root">
      <div className="container">
        <div className="about-content reveal">
          <span className="section-subtitle">Về Chúng Tôi</span>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
            Giới thiệu NovaTech
          </h2>
          <p className="text-body">{company.description}</p>
        </div>

        <div className="tech-grid">
          {company.technologies.map((tech, index) => (
            <div key={tech.techId} className={`tech-card reveal delay-${(index + 1) * 100}`}>
              <div className="tech-icon">
                <Icon name={tech.icon} />
              </div>
              <h3 className="tech-title">{tech.name}</h3>
              <p className="tech-desc">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
