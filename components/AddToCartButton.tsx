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
      className="btn btn-primary gap-2"
      style={added ? { background: "#22c55e", boxShadow: "none" } : undefined}
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
