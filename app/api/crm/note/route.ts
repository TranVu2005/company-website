import { getPayload } from "payload";
import config from "@payload-config";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";
import { hasRole } from "@/lib/rbac";

const VALID_TYPES = ["note", "call", "meeting", "email", "other"];

// Tạo ghi chú nội bộ cho 1 khách hàng. author tự gán qua hook beforeChange
// của CustomerNotes (collections/CustomerNotes.ts), không nhận từ body.
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
    // Ép về number: collection ID của Postgres adapter là serial (number), nên
    // relationship-field validator của Payload đòi typeof === "number" — chuỗi
    // "18" sẽ trượt validation dù customer tồn tại. Number() nhận cả số JSON lẫn
    // chuỗi số; NaN/0 bị chặn bởi guard !customerId phía dưới.
    customerId = body.customerId != null ? Number(body.customerId) : undefined;
    const type = VALID_TYPES.includes(body.type) ? body.type : "note";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!customerId || !content) {
      const message = "Thiếu customerId hoặc nội dung ghi chú";
      if (isForm) return crmActionRedirect(request, customerId, message);
      return Response.json({ message }, { status: 400 });
    }

    const doc = await payload.create({
      collection: "customer-notes",
      data: { customer: customerId, type, content },
      user,
    });

    // Form HTML thuần (CrmDetailView) điều hướng cả trang tới response của
    // POST — quay lại trang chi tiết khách thay vì để admin nhìn JSON thô.
    if (isForm) return crmActionRedirect(request, customerId);
    return Response.json({ message: "Đã thêm ghi chú", doc });
  } catch (error: any) {
    console.error("[crm] create note error:", error);
    if (isForm) return crmActionRedirect(request, customerId, "Có lỗi xảy ra");
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
