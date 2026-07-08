"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, Package, Truck, XCircle, Search } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";
import type { Order } from "@/lib/types";

function OrderTrackingContent() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { customer, loading: authLoading } = useCustomerAuth();
  const orderNumber = params.orderNumber;
  const status = searchParams.get("status");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(orderNumber || "");

  useEffect(() => {
    if (!authLoading && !customer) {
      router.push(`/login?redirect=/orders/${orderNumber || ""}`);
    }
  }, [authLoading, customer, router, orderNumber]);

  useEffect(() => {
    if (!customer) return;
    if (orderNumber) {
      fetchOrder(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber, customer]);

  const fetchOrder = async (num: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?orderNumber=${num}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
      }
    } catch (e) {
      console.error("Fetch order error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/orders/${searchInput.trim()}`);
    }
  };

  const statusSteps = [
    { key: "pending", label: "Chờ thanh toán", icon: Clock },
    { key: "paid", label: "Đã thanh toán", icon: CheckCircle },
    { key: "processing", label: "Đang xử lý", icon: Package },
    { key: "shipping", label: "Đang giao", icon: Truck },
    { key: "delivered", label: "Đã giao", icon: CheckCircle },
  ];

  const getStatusIndex = (status: string) => {
    const idx = statusSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  if (authLoading || !customer) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 page-content-offset pb-12">
      <h1 className="page-title font-bold mb-8">Theo dõi đơn hàng</h1>

      {status === "new" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Đặt hàng thành công! Chúng tôi sẽ liên hệ để xác nhận đơn hàng sớm nhất.
        </div>
      )}
      {status === "paid" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Thanh toán thành công! Đơn hàng của bạn đang được xử lý.
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nhập mã đơn hàng (vd: NVT-...)"
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Đang tra cứu...</p>
        </div>
      )}

      {!loading && !order && orderNumber && (
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-4">Mã đơn hàng {orderNumber} không tồn tại.</p>
          <Link href="/products" className="text-primary hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      )}

      {!loading && !order && !orderNumber && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nhập mã đơn hàng</h2>
          <p className="text-gray-500">Nhập mã đơn hàng để tra cứu trạng thái.</p>
        </div>
      )}

      {!loading && order && (
        <div className="space-y-6">
          {/* Order Info */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{order.orderNumber}</h2>
                <p className="text-sm text-gray-500">
                  Đặt ngày: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "delivered" ? "bg-green-100 text-green-700" :
                order.status === "cancelled" ? "bg-red-100 text-red-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {statusSteps.find((s) => s.key === order.status)?.label || order.status}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {statusSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = getStatusIndex(order.status) >= idx;
                const isCurrent = getStatusIndex(order.status) === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      isActive ? "text-primary font-medium" : "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">Chi tiết đơn hàng</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.productName} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString("vi-VN")} đ</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{order.total?.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">Thông tin giao hàng</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Người nhận</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">Điện thoại</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Địa chỉ</p>
                <p className="font-medium">{order.shippingAddress}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
