import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { verifyVnpayParams } from "@/lib/vnpay";
import { markOrderPaymentResult } from "@/lib/orders";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

// Trang VNPay chuyển trình duyệt của khách về sau khi thanh toán
// (vnp_ReturnUrl). Đây chỉ là nơi hiển thị kết quả cho khách xem — nguồn xác
// nhận chính thức vẫn là IPN (app/api/payment/vnpay/ipn) vì IPN được gọi
// server-to-server và không phụ thuộc việc khách có đóng trình duyệt hay
// không. Trang này vẫn tự cập nhật đơn hàng (idempotent) để hoạt động được
// cả khi phát triển cục bộ, nơi VNPay không gọi được IPN tới localhost.
export default async function VnpayReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v || "";
  };

  const orderId = get("vnp_TxnRef");
  const signature = get("vnp_SecureHash");

  if (!orderId || !signature) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Thiếu thông tin thanh toán
        </h1>
        <p className="text-muted-foreground mb-8">
          Không nhận được kết quả từ VNPay. Vui lòng kiểm tra đơn hàng của bạn.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Tra cứu đơn hàng
        </Link>
      </div>
    );
  }

  const allParams: Record<string, string> = {};
  for (const key of Object.keys(params)) {
    allParams[key] = get(key);
  }

  const isValid = verifyVnpayParams(allParams);

  if (!isValid) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Không thể xác thực kết quả thanh toán
        </h1>
        <p className="text-muted-foreground mb-8">
          Chữ ký từ VNPay không hợp lệ. Vui lòng kiểm tra lại đơn hàng {orderId} hoặc liên hệ hỗ trợ.
        </p>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Xem đơn hàng {orderId}
        </Link>
      </div>
    );
  }

  const success = get("vnp_ResponseCode") === "00" && get("vnp_TransactionStatus") === "00";
  await markOrderPaymentResult(orderId, success, get("vnp_TransactionNo"));

  return (
    <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
      {success && <ClearCartOnMount />}
      {success ? (
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      ) : (
        <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
      )}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        {success ? "Thanh toán thành công!" : "Thanh toán không thành công"}
      </h1>
      <p className="text-muted-foreground mb-8">
        {success
          ? "Cảm ơn bạn đã thanh toán qua VNPay. Đơn hàng của bạn đang được xử lý."
          : "Giao dịch VNPay đã bị hủy hoặc thất bại. Bạn có thể thử lại."}
      </p>
      <Link
        href={`/orders/${orderId}`}
        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Xem chi tiết đơn hàng
      </Link>
    </div>
  );
}
