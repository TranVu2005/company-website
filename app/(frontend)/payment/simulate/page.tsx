"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

function PaymentSimulateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const orderNumber = searchParams.get("order");
  const method = searchParams.get("method");
  const amount = searchParams.get("amount");

  useEffect(() => {
    // Mô phỏng xử lý thanh toán (3 giây) - kết quả do server quyết định và áp dụng
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/payment/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber }),
        });
        const data = await res.json();

        if (res.ok && data.status === "paid") {
          setStatus("success");
          // Thanh toán thành công mới xoá giỏ hàng — nếu thất bại, giỏ hàng
          // vẫn còn nguyên để khách đặt lại.
          clearCart();
          // Chuyển hướng đến trang đơn hàng sau 2 giây
          setTimeout(() => router.push(`/orders/${orderNumber}?status=paid`), 2000);
        } else {
          setStatus("failed");
        }
      } catch (e) {
        console.log("Payment simulate error:", e);
        setStatus("failed");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderNumber, router, clearCart]);

  const methodLabels: Record<string, string> = {
    vnpay: "VNPay",
    momo: "MoMo",
    zalopay: "ZaloPay",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-content-offset">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-xl shadow-lg">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Đang xử lý thanh toán</h1>
            <p className="text-gray-600 mb-4">
              Đang kết nối với {methodLabels[method || ""] || "cổng thanh toán"}...
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="font-bold">{orderNumber}</p>
              <p className="text-sm text-gray-500 mt-2">Số tiền</p>
              <p className="font-bold text-primary text-xl">
                {Number(amount).toLocaleString("vi-VN")} đ
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              (Mô phong thanh toán - sẽ tự động xử lý trong 3 giây)
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600">
              Đơn hàng {orderNumber} đã được thanh toán. Đang chuyển hướng...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-600 mb-4">
              Giao dịch không thành công. Vui lòng thử lại.
            </p>
            <button
              onClick={() => router.push("/cart")}
              className="px-6 py-2 bg-primary text-white rounded-lg"
            >
              Quay lại giỏ hàng
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSimulatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentSimulateContent />
    </Suspense>
  );
}
