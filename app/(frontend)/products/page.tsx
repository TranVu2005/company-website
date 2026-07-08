import Link from "next/link";
import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import { AddToCartButton } from "@/components/AddToCartButton";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Hệ sinh thái sản phẩm phần mềm của NovaTech Solutions.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 page-content-offset pb-12">
      <h1 className="page-title font-bold mb-8">Sản phẩm</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-semibold text-lg mb-1">{product.name}</h2>
                <p className="text-gray-500 text-sm mb-2 flex-1">{product.tagline}</p>
                <p className="text-primary font-bold mb-4">
                  {product.price.toLocaleString("vi-VN")} đ
                </p>
                <div className="flex items-center gap-3">
                  <AddToCartButton
                    id={product.id}
                    name={product.name}
                    image={product.image}
                    price={product.price}
                  />
                  <Link
                    href={`/products/${product.id}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
