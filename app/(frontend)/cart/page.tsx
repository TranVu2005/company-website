"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link
          href="/products"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng ({totalItems()} sản phẩm)</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-primary font-bold">
                {item.price.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right min-w-[100px]">
              <p className="font-bold">
                {(item.price * item.quantity).toLocaleString("vi-VN")} đ
              </p>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg">Tổng cộng:</span>
          <span className="text-2xl font-bold text-primary">
            {totalPrice().toLocaleString("vi-VN")} đ
          </span>
        </div>
        <Link
          href="/checkout"
          className="block w-full py-3 bg-primary text-white text-center rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Tiến hành đặt hàng
        </Link>
      </div>
    </div>
  );
}
