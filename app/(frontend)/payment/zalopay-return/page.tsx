import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { verifyZaloPayRedirect } from "@/lib/zalopay";
import { getOrderNumberByGatewayRef, markOrderPaymentResult } from "@/lib/orders";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

// Trang ZaloPay chuyển trình duyệt của khách về sau khi thanh toán
// (embed_data.redirecturl lúc tạo đơn). Đây chỉ là nơi hiển thị kết quả cho
// khách xem — nguồn xác nhận chính thức vẫn là callback server-to-server
// (app/api/payment/zalopay/callback), nhưng callback đó chỉ hoạt động khi
// Callback URL đã cấu hình trỏ về domain public trong Merchant Portal. Trang
// này tự cập nhật đơn hàng (idempotent) để vẫn hoạt động khi phát triển cục
// bộ hoặc khi chưa cấu hình callback.
export default async function ZaloPayReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v || "";
  };

  const appTransId = get("apptransid");
  const checksum = get("checksum");

  if (!appTransId || !checksum) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Thiếu thông tin thanh toán
        </h1>
        <p className="text-muted-foreground mb-8">
          Không nhận được kết quả từ ZaloPay. Vui lòng kiểm tra đơn hàng của bạn.
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

  const isValid = verifyZaloPayRedirect({
    appid: get("appid"),
    apptransid: appTransId,
    pmcid: get("pmcid"),
    bankcode: get("bankcode"),
    amount: get("amount"),
    discountamount: get("discountamount"),
    status: get("status"),
    checksum,
  });

  const orderNumber = await getOrderNumberByGatewayRef(appTransId);

  if (!isValid || !orderNumber) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Không thể xác thực kết quả thanh toán
        </h1>
        <p className="text-muted-foreground mb-8">
          Chữ ký từ ZaloPay không hợp lệ hoặc không tìm thấy đơn hàng tương ứng. Vui lòng liên hệ hỗ trợ.
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

  const success = get("status") === "1";
  await markOrderPaymentResult(orderNumber, success);

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
          ? "Cảm ơn bạn đã thanh toán qua ZaloPay. Đơn hàng của bạn đang được xử lý."
          : "Giao dịch ZaloPay đã bị hủy hoặc thất bại. Bạn có thể thử lại."}
      </p>
      <Link
        href={`/orders/${orderNumber}`}
        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Xem chi tiết đơn hàng
      </Link>
    </div>
  );
}
