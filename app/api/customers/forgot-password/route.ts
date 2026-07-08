import { getPayload } from "payload";
import config from "@payload-config";

// Ghi đè endpoint mặc định của Payload (POST /api/customers/forgot-password)
// vì bản mặc định gọi thẳng adapter Resend và ném lỗi 500 khi chưa cấu hình
// RESEND_API_KEY. Ở đây dùng disableEmail:true để tự lấy token qua Local API
// rồi gửi email theo đúng kiểu lib/email.ts (no-op an toàn + log khi thiếu
// RESEND_API_KEY) thay vì để cả request thất bại.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return Response.json({ message: "Thiếu email" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const token = await payload.forgotPassword({
      collection: "customers",
      data: { email },
      disableEmail: true,
    });

    // Không tìm thấy email → vẫn trả lời thành công như bình thường, tránh
    // lộ ra ngoài việc email nào đã đăng ký tài khoản (hành vi mặc định của
    // Payload, giữ nguyên nguyên tắc đó ở đây).
    if (token) {
      const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;

      if (process.env.RESEND_API_KEY) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `NovaTech Solutions <${process.env.LEAD_NOTIFY_FROM || "onboarding@resend.dev"}>`,
              to: email,
              subject: "Đặt lại mật khẩu - NovaTech Solutions",
              text: `Nhấn vào liên kết sau để đặt lại mật khẩu (liên kết hết hạn sau 1 giờ):\n\n${resetUrl}\n\nNếu bạn không yêu cầu điều này, hãy bỏ qua email này.`,
            }),
          });
          if (!res.ok) {
            console.error("[customer] gửi email đặt lại mật khẩu thất bại:", res.status, await res.text());
          }
        } catch (err) {
          console.error("[customer] lỗi gửi email đặt lại mật khẩu:", err);
        }
      } else {
        console.log("[customer] (email chưa cấu hình) link đặt lại mật khẩu:", resetUrl);
      }
    }

    return Response.json({ message: "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi." });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return Response.json({ message: "Có lỗi xảy ra, vui lòng thử lại." }, { status: 500 });
  }
}
