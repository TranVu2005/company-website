"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";

// Xoá giỏ hàng phía client khi trang xác nhận thanh toán (Server Component)
// biết chắc giao dịch đã thành công. Tách riêng vì localStorage/Zustand chỉ
// dùng được ở client, còn trang return của MoMo là Server Component.
export function ClearCartOnMount() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
