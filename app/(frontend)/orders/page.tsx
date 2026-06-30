"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, Package } from "lucide-react";

function OrdersContent() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/orders/${searchInput.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Theo dõi đơn hàng</h1>
      <p className="text-gray-500 mb-8">Nhập mã đơn hàng để tra cứu trạng thái giao hàng.</p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Mã đơn hàng (vd: NVT-...)"
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
