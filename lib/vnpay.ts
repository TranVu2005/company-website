import "server-only";
import crypto from "crypto";

// Tích hợp cổng thanh toán VNPay. Khác với MoMo, VNPay KHÔNG phát hành bộ
// khóa Sandbox dùng chung công khai — mỗi lập trình viên phải tự đăng ký
// merchant test (miễn phí) tại https://sandbox.vnpayment.vn/devreg/ để nhận
// vnp_TmnCode + vnp_HashSecret riêng. Nếu chưa cấu hình, isVnpayConfigured()
// trả về false để nơi gọi có thể fallback sang trang mô phỏng thay vì crash.
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";
const VNPAY_URL =
  process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

export function isVnpayConfigured(): boolean {
  return Boolean(VNPAY_TMN_CODE && VNPAY_HASH_SECRET);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// yyyyMMddHHmmss theo giờ Việt Nam (GMT+7), đúng định dạng VNPay yêu cầu.
function formatVnpayDate(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return (
    vn.getUTCFullYear().toString() +
    pad2(vn.getUTCMonth() + 1) +
    pad2(vn.getUTCDate()) +
    pad2(vn.getUTCHours()) +
    pad2(vn.getUTCMinutes()) +
    pad2(vn.getUTCSeconds())
  );
}

// VNPay ký (và xác thực) trên chuỗi query đã sort key theo alphabet, encode
// kiểu application/x-www-form-urlencoded — dùng URLSearchParams cho cả lúc
// ký lẫn lúc dựng URL để đảm bảo nhất quán.
function sortedSearchParams(params: Record<string, string>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value !== "" && value !== undefined && value !== null) {
      sp.append(key, value);
    }
  }
  return sp;
}

function sign(data: string): string {
  return crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex");
}

export interface CreateVnpayPaymentInput {
  orderId: string; // orderNumber của hệ thống, dùng làm vnp_TxnRef
  amount: number;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
}

// Trả về URL để chuyển hướng khách sang cổng thanh toán VNPay.
export function createVnpayPaymentUrl(input: CreateVnpayPaymentInput): string {
  if (!isVnpayConfigured()) {
    throw new Error(
      "VNPay chưa được cấu hình (thiếu VNPAY_TMN_CODE/VNPAY_HASH_SECRET trong .env)"
    );
  }

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.orderId,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: "other",
    // VNPay tính theo đơn vị 1/100 VND
    vnp_Amount: String(Math.round(input.amount) * 100),
    vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: formatVnpayDate(new Date()),
  };

  const searchParams = sortedSearchParams(params);
  const signature = sign(searchParams.toString());
  searchParams.append("vnp_SecureHash", signature);

  return `${VNPAY_URL}?${searchParams.toString()}`;
}

// Xác thực chữ ký khi VNPay gọi IPN (server-to-server, GET) hoặc chuyển
// trình duyệt khách về returnUrl — cùng một cách xác thực cho cả hai.
export function verifyVnpayParams(query: Record<string, string>): boolean {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  if (!vnp_SecureHash) return false;

  const searchParams = sortedSearchParams(rest as Record<string, string>);
  const expected = sign(searchParams.toString());

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(vnp_SecureHash, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
