import { getPayload } from "payload";
import config from "@payload-config";
import { getErrorMessage } from "@/lib/errors";

// Danh sách đơn hàng của tài khoản khách hàng đang đăng nhập, dùng cho trang
// /account. Khác với GET /api/orders (tra cứu công khai theo mã đơn), route
// này yêu cầu đăng nhập và chỉ trả về đơn của chính người gọi.
export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user || user.collection !== "customers") {
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const result = await payload.find({
      collection: "orders",
      where: { customer: { equals: user.id } },
      sort: "-createdAt",
      limit: 50,
    });

    return Response.json({ success: true, orders: result.docs });
  } catch (error: unknown) {
    console.error("Fetch my orders error:", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
