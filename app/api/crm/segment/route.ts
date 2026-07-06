import { getPayload } from "payload";
import config from "@payload-config";
import type { CustomerSegment } from "@/lib/crm";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";

const VALID_SEGMENTS: CustomerSegment[] = ["new", "potential", "vip"];

// Ghi đè nhóm khách hàng thủ công. Chỉ tài khoản nội bộ (users) được gọi —
// segmentOverride:true nên khi bật, Orders hook (lib/crm.ts) sẽ không tự
// tính lại nhóm này nữa cho tới khi gọi /api/crm/segment/auto.
export async function POST(request: Request) {
  const isForm = isFormRequest(request);
  let customerId: number | undefined;

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      if (isForm) return crmActionRedirect(request, undefined, "Không có quyền");
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { data: body } = await parseActionBody(request);
    customerId = body.customerId != null ? Number(body.customerId) : undefined;
    const segment = body.segment;

    if (!customerId || !VALID_SEGMENTS.includes(segment as CustomerSegment)) {
      const message = "Thiếu customerId hoặc segment không hợp lệ";
      if (isForm) return crmActionRedirect(request, customerId, message);
      return Response.json({ message }, { status: 400 });
    }

    const doc = await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment, segmentOverride: true },
    });

    // Form HTML thuần (CrmDetailView) điều hướng cả trang tới response của
    // POST — quay lại trang chi tiết khách thay vì để admin nhìn JSON thô.
    if (isForm) return crmActionRedirect(request, customerId);
    return Response.json({ message: "Đã cập nhật nhóm khách hàng", doc });
  } catch (error: any) {
    console.error("[crm] set segment error:", error);
    if (isForm) return crmActionRedirect(request, customerId, "Có lỗi xảy ra");
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
