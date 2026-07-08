import Link from "next/link";
import { getProducts } from "@/lib/data";
import { AddToCartButton } from "./AddToCartButton";

export default async function Products() {
  const products = await getProducts();

  return (
    <section className="products-section" id="products-root">
      <div className="blob products-blob" />
      <div className="container">
        <div className="reveal">
          <span className="section-subtitle text-center">Sản Phẩm Cốt Lõi</span>
          <h2 className="section-title">Hệ Sinh Thái Sản Phẩm</h2>
        </div>

        <div className="products-container">
          {products.map((product, index) => {
            const isEven = index % 2 !== 0;
            const contentReveal = isEven ? "reveal-right" : "reveal-left";
            const visualReveal = isEven ? "reveal-left" : "reveal-right";
            return (
              <div key={product.id} className="product-row">
                <div className={`product-content ${contentReveal}`}>
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-tagline">{product.tagline}</p>
                  <ul className="product-features">
                    {product.features.map((f, i) => (
                      <li key={i} className="feature-item">
                        {f.feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3 items-center">
                    <AddToCartButton id={product.id} name={product.name} image={product.image} />
                    <Link href={`/products/${product.id}`} className="btn btn-outline">
                      Tìm hiểu thêm
                    </Link>
                  </div>
                </div>

                <div className={`product-visual ${visualReveal}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
