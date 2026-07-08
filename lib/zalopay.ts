import "server-only";
import crypto from "crypto";

// Tích hợp cổng thanh toán ZaloPay. Bộ app_id/key1/key2 mặc định bên dưới là
// tài khoản Sandbox demo công khai do chính ZaloPay công bố trong tài liệu
// lập trình viên (docs.zalopay.vn) để mọi người thử nghiệm — giống MoMo. Khi
// lên môi trường thật, đặt ZALOPAY_APP_ID/ZALOPAY_KEY1/ZALOPAY_KEY2 trong
// .env bằng thông tin merchant thật do ZaloPay cấp, và cấu hình Callback URL
// trỏ về /api/payment/zalopay/callback trong ZaloPay Merchant Portal.
const ZALOPAY_APP_ID = process.env.ZALOPAY_APP_ID || "2553";
const ZALOPAY_KEY1 = process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL";
const ZALOPAY_KEY2 = process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz";
const ZALOPAY_ENDPOINT =
  process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create";

function hmac256(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

// app_trans_id bắt buộc theo định dạng yyMMdd_xxxx và duy nhất trong ngày
// (yêu cầu của ZaloPay) — không dùng trực tiếp orderNumber (dạng NVT-...)
// được, nên sinh riêng và lưu vào field gatewayRef của đơn hàng để tra cứu
// ngược khi nhận kết quả thanh toán.
export function generateZaloPayAppTransId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}_${Date.now()}`;
}

export interface CreateZaloPayOrderInput {
  appTransId: string;
  amount: number;
  description: string;
  redirectUrl: string;
}

export interface CreateZaloPayOrderResult {
  orderUrl: string;
  returnCode: number;
  returnMessage: string;
}

const ZALOPAY_APP_USER = "NovaTechCustomer";

export async function createZaloPayOrder(
  input: CreateZaloPayOrderInput
): Promise<CreateZaloPayOrderResult> {
  const appTime = Date.now();
  const embedData = JSON.stringify({ redirecturl: input.redirectUrl });
  const item = JSON.stringify([]);
  const amount = Math.round(input.amount);

  const macInput = [
    ZALOPAY_APP_ID,
    input.appTransId,
    ZALOPAY_APP_USER,
    amount,
    appTime,
    embedData,
    item,
  ].join("|");

  const mac = hmac256(macInput, ZALOPAY_KEY1);

  const res = await fetch(ZALOPAY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: Number(ZALOPAY_APP_ID),
      app_trans_id: input.appTransId,
      app_user: ZALOPAY_APP_USER,
      app_time: appTime,
      amount,
      item,
      embed_data: embedData,
      description: input.description,
      bank_code: "",
      mac,
    }),
  });

  const data = await res.json();

  if (!res.ok || typeof data.return_code !== "number") {
    throw new Error(data.return_message || "Không thể tạo yêu cầu thanh toán ZaloPay");
  }

  return {
    orderUrl: data.order_url,
    returnCode: data.return_code,
    returnMessage: data.return_message,
  };
}

// Xác thực checksum khi ZaloPay chuyển trình duyệt khách về redirecturl
// (embed_data.redirecturl lúc tạo đơn) — hoạt động cả ở localhost vì không
// phụ thuộc Callback URL cấu hình trên Merchant Portal.
export interface ZaloPayRedirectParams {
  appid: string;
  apptransid: string;
  pmcid: string;
  bankcode: string;
  amount: string;
  discountamount: string;
  status: string;
  checksum: string;
}

export function verifyZaloPayRedirect(params: ZaloPayRedirectParams): boolean {
  const data = [
    params.appid,
    params.apptransid,
    params.pmcid,
    params.bankcode,
    params.amount,
    params.discountamount,
    params.status,
  ].join("|");

  const expected = hmac256(data, ZALOPAY_KEY2);

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(params.checksum || "", "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

// Xác thực MAC cho callback server-to-server thật sự (chỉ ZaloPay gọi được
// khi Callback URL đã cấu hình trong Merchant Portal trỏ về domain public).
export function verifyZaloPayCallbackMac(dataStr: string, mac: string): boolean {
  const expected = hmac256(dataStr, ZALOPAY_KEY2);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(mac || "", "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
