import Link from "next/link";
import type { Metadata } from "next";
import { POLICIES } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Chính sách & Điều khoản",
  description:
    "Các chính sách và điều khoản của NovaTech: bảo mật, thanh toán, vận chuyển, đổi trả, bảo hành, khiếu nại.",
};

export default function PolicyIndexPage() {
  return (
    <main id="detail-content">
      <div className="detail-page">
        <div
          className="container detail-content"
          style={{ maxWidth: 900, paddingTop: "8rem", paddingBottom: "4rem" }}
        >
          <span className="section-subtitle">Pháp lý</span>
          <h1 className="detail-title" style={{ textAlign: "left" }}>
            Chính sách &amp; Điều khoản
          </h1>
          <p className="text-body" style={{ marginBottom: "2rem" }}>
            Các quy định, chính sách áp dụng khi sử dụng website và dịch vụ của
            NovaTech.
          </p>

          <div className="grid grid-2">
            {POLICIES.map((p) => (
              <Link
                key={p.slug}
                href={`/chinh-sach/${p.slug}`}
                className="service-card"
                style={{ display: "block" }}
              >
                <h3 className="service-title">{p.title}</h3>
                <p className="service-desc">{p.summary}</p>
                <span className="service-link">Xem chi tiết →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
