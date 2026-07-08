import { getPayload } from "payload";
import config from "@payload-config";

// Đổi mật khẩu khi đã đăng nhập — khác với reset-password (quên mật khẩu,
// xác thực bằng token gửi qua email), route này bắt phải nhập đúng mật khẩu
// hiện tại trước khi cho đổi, phòng trường hợp phiên đăng nhập bị chiếm dụng
// (vd dùng chung máy tính) — chỉ có cookie hợp lệ thôi là chưa đủ.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user || user.collection !== "customers") {
      return Response.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return Response.json({ message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    try {
      await payload.login({
        collection: "customers",
        data: { email: user.email || "", password: currentPassword },
      });
    } catch {
      return Response.json({ message: "Mật khẩu hiện tại không đúng" }, { status: 401 });
    }

    await payload.update({
      collection: "customers",
      id: user.id,
      data: { password: newPassword },
    });

    return Response.json({ message: "Đổi mật khẩu thành công" });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    return Response.json({ message: "Có lỗi xảy ra, vui lòng thử lại." }, { status: 500 });
  }
}
