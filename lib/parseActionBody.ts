import "server-only";

/**
 * app/api/crm/* nhận request từ 2 nguồn: form HTML thuần trong CrmDetailView
 * (gửi application/x-www-form-urlencoded) và các lệnh curl/fetch thủ công khi
 * verify (gửi application/json). request.json() ném lỗi/treo với body
 * urlencoded, nên phải phân nhánh theo Content-Type trước khi đọc body.
 */
export function isFormRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") || "";
  return !contentType.includes("application/json");
}

export async function parseActionBody(
  request: Request
): Promise<{ data: Record<string, string>; isForm: boolean }> {
  const isForm = isFormRequest(request);

  if (!isForm) {
    const data = await request.json();
    return { data, isForm: false };
  }

  const text = await request.text();
  const params = new URLSearchParams(text);
  const data: Record<string, string> = {};
  for (const [key, value] of params) data[key] = value;
  return { data, isForm: true };
}

/**
 * Điều hướng 303 về lại trang chi tiết khách (hoặc danh sách CRM nếu chưa
 * biết customerId, vd lỗi xác thực trước khi đọc được body) sau khi form
 * submit — kể cả khi thất bại, để admin không bị kẹt ở trang JSON thô.
 */
export function crmActionRedirect(request: Request, customerId: number | undefined, error?: string): Response {
  const path = customerId ? `/admin/crm/${customerId}` : "/admin/crm";
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("crmError", error);
  return Response.redirect(url, 303);
}
