import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServices, getServiceById } from "@/lib/data";
import Icon from "@/components/Icon";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) return { title: "Không tìm thấy dịch vụ" };
  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/services/${service.id}` },
    openGraph: {
      type: "website",
      title: service.title,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <main id="detail-content">
      <div className="detail-page">
        <div className="detail-hero reveal">
          <div className="container text-center">
            <div className="detail-icon">
              <Icon name={service.icon} size={64} />
            </div>
            <h1 className="detail-title">{service.title}</h1>
            <p className="detail-subtitle">{service.description}</p>
          </div>
        </div>

        <div className="container detail-content reveal delay-200">
          <div className="grid grid-2" style={{ alignItems: "start" }}>
            <div className="detail-text">
              <h3>Tổng quan dịch vụ</h3>
              <p>{service.details}</p>
              <div style={{ marginTop: "2rem" }}>
                <Link href="/" className="btn btn-outline">
                  ← Quay lại trang chủ
                </Link>
                <Link
                  href="/#contact-root"
                  className="btn btn-primary"
                  style={{ marginLeft: "1rem" }}
                >
                  Nhận tư vấn ngay
                </Link>
              </div>
            </div>
            <div className="detail-features card">
              <h3>Giá trị mang lại</h3>
              <ul className="feature-list" style={{ listStyle: "none", padding: 0 }}>
                {(service.features ?? []).map((f, i) => (
                  <li key={i}>
                    <Icon
                      name="check-circle"
                      size={20}
                      color="var(--accent-primary)"
                    />{" "}
                    {f.feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
