import "server-only";

/**
 * app/api/crm/* nhận request từ 2 nguồn: form HTML thuần trong CrmDetailView
 * (gửi application/x-www-form-urlencoded) và các lệnh curl/fetch thủ công khi
 * verify (gửi application/json). request.json() ném lỗi/treo với body
 * urlencoded, nên phải phân nhánh theo Content-Type trước khi đọc body.
 */
export async function parseActionBody(
  request: Request
): Promise<{ data: Record<string, string>; isForm: boolean }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await request.json();
    return { data, isForm: false };
  }

  const text = await request.text();
  const params = new URLSearchParams(text);
  const data: Record<string, string> = {};
  for (const [key, value] of params) data[key] = value;
  return { data, isForm: true };
}
