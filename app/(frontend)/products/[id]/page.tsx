import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProducts, getProductById } from "@/lib/data";
import Icon from "@/components/Icon";

// Pre-render tất cả trang sản phẩm (SSG)
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: product.tagline,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.tagline,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <main id="detail-content">
      <div className="detail-page">
        <div className="detail-hero reveal">
          <div className="container text-center">
            <span className="section-subtitle">Sản phẩm phần mềm</span>
            <h1 className="detail-title">{product.name}</h1>
            <p className="detail-subtitle">{product.tagline}</p>
          </div>
        </div>

        <div className="container detail-content reveal delay-200">
          <div className="product-row" style={{ marginTop: 0 }}>
            <div className="product-content">
              <h3>Mô tả sản phẩm</h3>
              <p>{product.details}</p>
              <h3 style={{ marginTop: "2rem" }}>Tính năng nổi bật</h3>
              <ul className="product-features" style={{ marginBottom: "2rem" }}>
                {product.features.map((f, i) => (
                  <li key={i}>
                    <Icon
                      name="check"
                      size={20}
                      color="var(--accent-primary)"
                    />{" "}
                    {f.feature}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "2rem" }}>
                <Link href="/" className="btn btn-outline">
                  ← Quay lại
                </Link>
                <Link
                  href="/#contact-root"
                  className="btn btn-primary"
                  style={{ marginLeft: "1rem" }}
                >
                  Yêu cầu Demo
                </Link>
              </div>
            </div>

            <div className="product-visual">
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
