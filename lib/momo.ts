import "server-only";
import crypto from "crypto";

// Tích hợp cổng thanh toán MoMo (môi trường Sandbox/Test theo mặc định).
// Tài liệu: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
//
// Giá trị mặc định bên dưới là bộ thông tin Test Environment công khai do
// MoMo cung cấp cho mọi lập trình viên (không phải bí mật riêng của dự án),
// dùng để chạy thử luồng thanh toán với "tiền giả". Khi lên môi trường thật,
// đặt MOMO_PARTNER_CODE/MOMO_ACCESS_KEY/MOMO_SECRET_KEY/MOMO_ENDPOINT trong
// .env bằng thông tin merchant thật do MoMo cấp.
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY =
  process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT ||
  "https://test-payment.momo.vn/v2/gateway/api/create";

function sign(rawSignature: string): string {
  return crypto
    .createHmac("sha256", MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest("hex");
}

export interface CreateMomoPaymentInput {
  orderId: string; // dùng orderNumber của đơn hàng, phải duy nhất
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
}

export interface CreateMomoPaymentResult {
  payUrl: string;
  resultCode: number;
  message: string;
}

// Tạo yêu cầu thanh toán, trả về payUrl để chuyển hướng khách hàng sang MoMo.
export async function createMomoPayment(
  input: CreateMomoPaymentInput
): Promise<CreateMomoPaymentResult> {
  const requestId = `${input.orderId}-${Date.now()}`;
  const requestType = "captureWallet";
  const extraData = "";
  const amount = Math.round(input.amount).toString();

  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&ipnUrl=${input.ipnUrl}&orderId=${input.orderId}&orderInfo=${input.orderInfo}` +
    `&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${input.redirectUrl}` +
    `&requestId=${requestId}&requestType=${requestType}`;

  const signature = sign(rawSignature);

  const res = await fetch(MOMO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerCode: MOMO_PARTNER_CODE,
      partnerName: "NovaTech Solutions",
      storeId: "NovaTechStore",
      requestId,
      amount,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      redirectUrl: input.redirectUrl,
      ipnUrl: input.ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      signature,
    }),
  });

  const data = await res.json();

  if (!res.ok || typeof data.resultCode !== "number") {
    throw new Error(data.message || "Không thể tạo yêu cầu thanh toán MoMo");
  }

  return { payUrl: data.payUrl, resultCode: data.resultCode, message: data.message };
}

// Các field MoMo gửi kèm chữ ký khi redirect trình duyệt về (GET) và khi
// gọi IPN server-to-server (POST). Dùng chung một hàm xác thực cho cả hai.
export interface MomoCallbackParams {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: string;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: string;
  message: string;
  payType: string;
  responseTime: string;
  extraData: string;
  signature: string;
}

export function verifyMomoSignature(params: MomoCallbackParams): boolean {
  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${params.amount}&extraData=${params.extraData}` +
    `&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}` +
    `&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}` +
    `&requestId=${params.requestId}&responseTime=${params.responseTime}` +
    `&resultCode=${params.resultCode}&transId=${params.transId}`;

  const expected = sign(rawSignature);

  // So sánh độ dài bằng nhau trước khi timingSafeEqual để tránh throw khi
  // signature từ bên ngoài có độ dài khác (vd bị giả mạo/ngắn hơn).
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(params.signature || "", "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
