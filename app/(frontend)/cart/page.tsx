"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShoppingBag className="w-9 h-9 text-muted-foreground" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Bạn chưa có sản phẩm nào trong giỏ hàng. Khám phá các sản phẩm của chúng tôi ngay.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Giỏ hàng</h1>
          <p className="text-muted-foreground mt-1">{totalItems()} sản phẩm trong giỏ hàng của bạn</p>
        </div>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua sắm
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Item list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg shrink-0 bg-secondary"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                <p className="text-primary font-bold mt-1">
                  {item.price.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Giảm số lượng"
                    className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Tăng số lượng"
                    className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[110px]">
                  <p className="font-bold text-foreground tabular-nums">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Xóa sản phẩm"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            href="/products"
            className="sm:hidden inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-28 bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-semibold text-foreground mb-4">Tóm tắt đơn hàng</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span className="tabular-nums text-foreground">{totalPrice().toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span className="text-foreground">Tính khi đặt hàng</span>
            </div>
          </div>

          <div className="border-t border-border my-4" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="font-semibold text-foreground">Tổng cộng</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {totalPrice().toLocaleString("vi-VN")} đ
            </span>
          </div>

          <Link
            href="/checkout"
            className="block w-full py-3 bg-primary text-primary-foreground text-center rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Tiến hành đặt hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
