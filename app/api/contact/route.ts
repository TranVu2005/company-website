"use server";

import { getPayload } from "payload";
import config from "../../../payload.config";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  subject: string;
  message: string;
  consent: boolean;
}

export async function POST(request: Request) {
  try {
    const formData: ContactFormData = await request.json();
    const payload = await getPayload({ config });

    // Save to Payload CMS (leads collection)
    await payload.create({
      collection: "leads",
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || "",
        subject: formData.subject,
        message: formData.message,
        status: "new",
        source: "website-contact-form",
      },
    });

    // Send notification email (if Resend is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.LEAD_NOTIFY_FROM || "noreply@novatech.demo",
          to: process.env.LEAD_NOTIFY_TO || "contact@novatech.demo",
          subject: `[Liên hệ] ${formData.subject} - ${formData.name}`,
          html: `
            <h2>Liên hệ mới từ website</h2>
            <p><strong>Họ tên:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Điện thoại:</strong> ${formData.phone}</p>
            <p><strong>Công ty:</strong> ${formData.company || "N/A"}</p>
            <p><strong>Chủ đề:</strong> ${formData.subject}</p>
            <p><strong>Nội dung:</strong></p>
            <p>${formData.message}</p>
            <hr/>
            <p><small>Gửi từ form liên hệ NovaTech Solutions</small></p>
          `,
        });

        // Send confirmation email to customer
        await resend.emails.send({
          from: process.env.LEAD_NOTIFY_FROM || "noreply@novatech.demo",
          to: formData.email,
          subject: "Đã nhận liên hệ - NovaTech Solutions",
          html: `
            <h2>Cảm ơn bạn đã liên hệ với NovaTech!</h2>
            <p>Chào ${formData.name},</p>
            <p>Chúng tôi đã nhận được thông tin liên hệ của bạn và sẽ phản hồi trong vòng 24 giờ làm việc.</p>
            <p><strong>Chủ đề:</strong> ${formData.subject}</p>
            <hr/>
            <p><small>Đây là email tự động, vui lòng không trả lời.</small></p>
          `,
        });
      } catch (emailError) {
        console.log("Email send failed (Resend not configured):", emailError);
      }
    }

    return Response.json({ success: true, message: "Liên hệ đã được gửi thành công!" });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return Response.json({ success: false, error: error.message || "Có lỗi xảy ra, vui lòng thử lại." }, { status: 500 });
  }
}
