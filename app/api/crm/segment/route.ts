import { getPayload } from "payload";
import config from "@payload-config";
import type { CustomerSegment } from "@/lib/crm";

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

    const body = await request.json();
    const customerId = body.customerId != null ? Number(body.customerId) : undefined;
    const segment = body.segment;

    if (!customerId || !VALID_SEGMENTS.includes(segment)) {
      return Response.json({ message: "Thiếu customerId hoặc segment không hợp lệ" }, { status: 400 });
    }

    const doc = await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment, segmentOverride: true },
    });

    return Response.json({ message: "Đã cập nhật nhóm khách hàng", doc });
  } catch (error: any) {
    console.error("[crm] set segment error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
