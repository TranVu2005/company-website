import { getPayload } from "payload";
import config from "@payload-config";
import type { CustomerSegment } from "@/lib/crm";
import { parseActionBody } from "@/lib/parseActionBody";

const VALID_SEGMENTS: CustomerSegment[] = ["new", "potential", "vip"];

// Ghi đè nhóm khách hàng thủ công. Chỉ tài khoản nội bộ (users) được gọi —
// segmentOverride:true nên khi bật, Orders hook (lib/crm.ts) sẽ không tự
// tính lại nhóm này nữa cho tới khi gọi /api/crm/segment/auto.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { data: body, isForm } = await parseActionBody(request);
    const customerId = body.customerId != null ? Number(body.customerId) : undefined;
    const segment = body.segment;

    if (!customerId || !VALID_SEGMENTS.includes(segment as CustomerSegment)) {
      return Response.json({ message: "Thiếu customerId hoặc segment không hợp lệ" }, { status: 400 });
    }

    const doc = await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment, segmentOverride: true },
    });

    // Form HTML thuần (CrmDetailView) điều hướng cả trang tới response của
    // POST — quay lại trang chi tiết khách thay vì để admin nhìn JSON thô.
    if (isForm) {
      return Response.redirect(new URL(`/admin/crm/${customerId}`, request.url), 303);
    }
    return Response.json({ message: "Đã cập nhật nhóm khách hàng", doc });
  } catch (error: any) {
    console.error("[crm] set segment error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
