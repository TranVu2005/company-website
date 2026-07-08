import Link from "next/link";
import { getServices } from "@/lib/data";
import Icon from "./Icon";

export default async function Services() {
  const services = await getServices();

  return (
    <section className="services-section" id="services-root">
      <div className="blob services-blob" />
      <div className="container">
        <div className="reveal">
          <span className="section-subtitle text-center">
            Dịch Vụ &amp; Giải Pháp
          </span>
          <h2 className="section-title">Dịch vụ của NovaTech</h2>
        </div>

        <div className="grid grid-3">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`service-card reveal delay-${((index % 3) + 1) * 100}`}
            >
              <div className="service-icon">
                <Icon name={service.icon} />
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
              <Link href={`/services/${service.id}`} className="service-link">
                Xem chi tiết
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
