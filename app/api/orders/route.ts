import { getPayload } from "payload";
import type { Where } from "payload";
import config from "../../../payload.config";
import { sendOrderConfirmation } from "@/lib/email";
import { createMomoPayment } from "@/lib/momo";
import { createVnpayPaymentUrl, isVnpayConfigured } from "@/lib/vnpay";
import { createZaloPayOrder, generateZaloPayAppTransId } from "@/lib/zalopay";
import { setOrderGatewayRef } from "@/lib/orders";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Bắt buộc đăng nhập bằng tài khoản khách hàng mới được đặt hàng — đọc
    // JWT từ cookie/Authorization header, không tin bất kỳ trường nào client
    // tự khai là "đã đăng nhập".
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "customers") {
      return Response.json(
        { success: false, error: "Vui lòng đăng nhập để đặt hàng.", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Create order in Payload CMS
    const order = await payload.create({
      collection: "orders",
      data: {
        customer: user.id,
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerCompany: body.customerCompany || "",
        shippingAddress: body.shippingAddress,
        note: body.note || "",
        items: body.items,
        subtotal: body.subtotal,
        shippingFee: body.shippingFee || 0,
        total: body.total,
        status: "pending",
        paymentMethod: body.paymentMethod,
        paymentStatus: "unpaid",
      },
    });

    await sendOrderConfirmation({
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      total: body.total,
      items: body.items,
    });

    // Cả ba cổng đều lưu đơn ở trạng thái "pending/unpaid"; trạng thái
    // "paid" chỉ được cập nhật khi chính cổng thanh toán xác nhận qua
    // IPN/callback hoặc trang return (đã xác thực chữ ký), không bao giờ
    // tin trực tiếp vào client.
    const origin = new URL(request.url).origin;

    // MoMo: tích hợp cổng thanh toán thật (mặc định môi trường Sandbox/Test —
    // xem lib/momo.ts).
    if (body.paymentMethod === "momo") {
      try {
        const momoResult = await createMomoPayment({
          orderId: body.orderNumber,
          amount: body.total,
          orderInfo: `Thanh toan don hang ${body.orderNumber} - NovaTech Solutions`,
          redirectUrl: `${origin}/payment/momo-return`,
          ipnUrl: `${origin}/api/payment/momo/ipn`,
        });

        if (momoResult.resultCode !== 0 || !momoResult.payUrl) {
          throw new Error(momoResult.message || "MoMo từ chối yêu cầu thanh toán");
        }

        return Response.json({
          success: true,
          orderId: order.id,
          orderNumber: body.orderNumber,
          paymentUrl: momoResult.payUrl,
        });
      } catch (momoError: unknown) {
        console.error("MoMo create payment error:", momoError);
        return Response.json(
          {
            success: false,
            error:
              "Không thể khởi tạo thanh toán MoMo: " +
              (getErrorMessage(momoError) || "Vui lòng thử lại."),
          },
          { status: 502 }
        );
      }
    }

    // VNPay: tích hợp cổng thanh toán thật — cần đăng ký merchant test riêng
    // tại sandbox.vnpayment.vn (VNPay không phát hành khóa test dùng chung
    // công khai như MoMo/ZaloPay). Nếu chưa cấu hình VNPAY_TMN_CODE/
    // VNPAY_HASH_SECRET, fallback về trang mô phỏng để không chặn demo.
    if (body.paymentMethod === "vnpay") {
      if (!isVnpayConfigured()) {
        return Response.json({
          success: true,
          orderId: order.id,
          orderNumber: body.orderNumber,
          paymentUrl: `/payment/simulate?order=${body.orderNumber}&method=vnpay&amount=${body.total}`,
        });
      }
      try {
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "127.0.0.1";
        const paymentUrl = createVnpayPaymentUrl({
          orderId: body.orderNumber,
          amount: body.total,
          orderInfo: `Thanh toan don hang ${body.orderNumber}`,
          returnUrl: `${origin}/payment/vnpay-return`,
          ipAddr: ip,
        });
        return Response.json({
          success: true,
          orderId: order.id,
          orderNumber: body.orderNumber,
          paymentUrl,
        });
      } catch (vnpayError: unknown) {
        console.error("VNPay create payment error:", vnpayError);
        return Response.json(
          {
            success: false,
            error:
              "Không thể khởi tạo thanh toán VNPay: " +
              (getErrorMessage(vnpayError) || "Vui lòng thử lại."),
          },
          { status: 502 }
        );
      }
    }

    // ZaloPay: tích hợp cổng thanh toán thật (mặc định môi trường Sandbox
    // demo công khai của ZaloPay — xem lib/zalopay.ts).
    if (body.paymentMethod === "zalopay") {
      try {
        const appTransId = generateZaloPayAppTransId();
        await setOrderGatewayRef(body.orderNumber, appTransId);

        const zaloResult = await createZaloPayOrder({
          appTransId,
          amount: body.total,
          description: `Thanh toan don hang ${body.orderNumber}`,
          redirectUrl: `${origin}/payment/zalopay-return`,
        });

        if (zaloResult.returnCode !== 1 || !zaloResult.orderUrl) {
          throw new Error(zaloResult.returnMessage || "ZaloPay từ chối yêu cầu thanh toán");
        }

        return Response.json({
          success: true,
          orderId: order.id,
          orderNumber: body.orderNumber,
          paymentUrl: zaloResult.orderUrl,
        });
      } catch (zaloError: unknown) {
        console.error("ZaloPay create payment error:", zaloError);
        return Response.json(
          {
            success: false,
            error:
              "Không thể khởi tạo thanh toán ZaloPay: " +
              (getErrorMessage(zaloError) || "Vui lòng thử lại."),
          },
          { status: 502 }
        );
      }
    }

    // COD or bank transfer - order created successfully
    return Response.json({
      success: true,
      orderId: order.id,
      orderNumber: body.orderNumber,
    });
  } catch (error: unknown) {
    console.error("Order creation error:", error);
    return Response.json(
      { success: false, error: getErrorMessage(error) || "Không thể tạo đơn hàng" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return Response.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // Tra cứu đơn hàng giờ cũng bắt buộc đăng nhập, và khách chỉ tra cứu
    // được đơn của chính mình — trước đây route này công khai hoàn toàn nên
    // ai biết mã đơn (dò được) cũng xem được tên/SĐT/địa chỉ của người khác.
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) {
      return Response.json(
        { error: "Vui lòng đăng nhập để tra cứu đơn hàng.", requireLogin: true },
        { status: 401 }
      );
    }

    const where: Where = { orderNumber: { equals: orderNumber } };
    if (user.collection !== "users") {
      where.customer = { equals: user.id };
    }

    const result = await payload.find({
      collection: "orders",
      where,
      limit: 1,
    });

    if (result.docs.length === 0) {
      return Response.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return Response.json({ success: true, order: result.docs[0] });
  } catch (error: unknown) {
    console.error("Order fetch error:", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
