import { getPayload } from "payload";
import config from "@payload-config";
import { recomputeSegment } from "@/lib/crm";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";
import { hasRole } from "@/lib/rbac";

// Bỏ ghi đè thủ công và tính lại nhóm theo doanh số hiện tại.
export async function POST(request: Request) {
  const isForm = isFormRequest(request);
  let customerId: number | undefined;

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || !hasRole(user, ["admin", "sales"])) {
      if (isForm) return crmActionRedirect(request, undefined, "Không có quyền");
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { data: body } = await parseActionBody(request);
    customerId = body.customerId != null ? Number(body.customerId) : undefined;
    if (!customerId) {
      const message = "Thiếu customerId";
      if (isForm) return crmActionRedirect(request, customerId, message);
      return Response.json({ message }, { status: 400 });
    }

    await payload.update({
      collection: "customers",
      id: customerId,
      data: { segmentOverride: false },
    });
    await recomputeSegment(payload, customerId);

    // Form HTML thuần (CrmDetailView) điều hướng cả trang tới response của
    // POST — quay lại trang chi tiết khách thay vì để admin nhìn JSON thô.
    if (isForm) return crmActionRedirect(request, customerId);
    const doc = await payload.findByID({ collection: "customers", id: customerId });
    return Response.json({ message: "Đã quay lại tự động phân nhóm", doc });
  } catch (error: unknown) {
    console.error("[crm] auto segment error:", error);
    if (isForm) return crmActionRedirect(request, customerId, "Có lỗi xảy ra");
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
