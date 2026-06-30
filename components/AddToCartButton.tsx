"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { ShoppingCart, Check } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  price?: number;
}

export function AddToCartButton({ id, name, image, price = 0 }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id, name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
        added
          ? "bg-green-500 text-white"
          : "bg-primary text-white hover:bg-primary/90"
      }`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Đã thêm
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Thêm vào giỏ
        </>
      )}
    </button>
  );
}
