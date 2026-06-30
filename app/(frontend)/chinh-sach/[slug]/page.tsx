import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POLICIES, getPolicy } from "@/lib/legal";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return { title: "Không tìm thấy" };
  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <main id="detail-content">
      <div className="detail-page">
        <div
          className="container detail-content"
          style={{ maxWidth: 800, paddingTop: "8rem", paddingBottom: "4rem" }}
        >
          <Link
            href="/chinh-sach"
            className="btn btn-outline"
            style={{ marginBottom: "2rem", border: "none", paddingLeft: 0 }}
          >
            ← Tất cả chính sách
          </Link>

          <h1
            className="detail-title"
            style={{ textAlign: "left", fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            {policy.title}
          </h1>
          <p className="text-muted" style={{ marginBottom: "2.5rem" }}>
            Cập nhật lần cuối:{" "}
            {new Date(policy.updated).toLocaleDateString("vi-VN")}
          </p>

          {policy.sections.map((section, i) => (
            <section key={i} style={{ marginBottom: "2rem" }}>
              <h3>{section.heading}</h3>
              {section.body.map((para, j) => (
                <p key={j} className="text-body">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
