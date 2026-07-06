import { getPayload } from "payload";
import config from "@payload-config";

const VALID_TYPES = ["note", "call", "meeting", "email", "other"];

// Tạo ghi chú nội bộ cho 1 khách hàng. author tự gán qua hook beforeChange
// của CustomerNotes (collections/CustomerNotes.ts), không nhận từ body.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = await request.json();
    // Ép về number: collection ID của Postgres adapter là serial (number), nên
    // relationship-field validator của Payload đòi typeof === "number" — chuỗi
    // "18" sẽ trượt validation dù customer tồn tại. Number() nhận cả số JSON lẫn
    // chuỗi số; NaN/0 bị chặn bởi guard !customerId phía dưới.
    const customerId = body.customerId != null ? Number(body.customerId) : undefined;
    const type = VALID_TYPES.includes(body.type) ? body.type : "note";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!customerId || !content) {
      return Response.json({ message: "Thiếu customerId hoặc nội dung ghi chú" }, { status: 400 });
    }

    const doc = await payload.create({
      collection: "customer-notes",
      data: { customer: customerId, type, content },
      user,
    });

    return Response.json({ message: "Đã thêm ghi chú", doc });
  } catch (error: any) {
    console.error("[crm] create note error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
