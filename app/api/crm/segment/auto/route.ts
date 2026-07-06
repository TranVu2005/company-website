import { getPayload } from "payload";
import config from "@payload-config";
import { recomputeSegment } from "@/lib/crm";

// Bỏ ghi đè thủ công và tính lại nhóm theo doanh số hiện tại.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const customerId = body.customerId != null ? Number(body.customerId) : undefined;
    if (!customerId) {
      return Response.json({ message: "Thiếu customerId" }, { status: 400 });
    }

    await payload.update({
      collection: "customers",
      id: customerId,
      data: { segmentOverride: false },
    });
    await recomputeSegment(payload, customerId);

    const doc = await payload.findByID({ collection: "customers", id: customerId });
    return Response.json({ message: "Đã quay lại tự động phân nhóm", doc });
  } catch (error: any) {
    console.error("[crm] auto segment error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
