// Nội dung trang pháp lý/chính sách (mục 5 của KIEN_TRUC_TRANG_WEBSITE.md).
// LƯU Ý: đây là nội dung mẫu có cấu trúc — cần bộ phận pháp chế của công ty rà soát
// và điền thông tin cụ thể ([Tên công ty], [MST], thời hạn...) trước khi go-live.

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface Policy {
  slug: string;
  title: string;
  summary: string;
  updated: string; // ISO date
  sections: PolicySection[];
}

const UPDATED = "2026-06-23";

export const POLICIES: Policy[] = [
  {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng",
    summary: "Quy định chung khi sử dụng website và dịch vụ của NovaTech.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Chấp nhận điều khoản",
        body: [
          "Khi truy cập và sử dụng website này, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng website.",
        ],
      },
      {
        heading: "2. Quyền và nghĩa vụ của người dùng",
        body: [
          "Người dùng cam kết cung cấp thông tin chính xác khi đăng ký tư vấn, yêu cầu báo giá hoặc đặt hàng.",
          "Không sử dụng website cho mục đích vi phạm pháp luật, phát tán mã độc, hoặc xâm phạm quyền lợi của bên thứ ba.",
        ],
      },
      {
        heading: "3. Quyền sở hữu trí tuệ",
        body: [
          "Toàn bộ nội dung, logo, hình ảnh và phần mềm trên website thuộc quyền sở hữu của [Tên công ty] và được bảo hộ theo quy định pháp luật.",
        ],
      },
      {
        heading: "4. Thay đổi điều khoản",
        body: [
          "Chúng tôi có quyền cập nhật điều khoản sử dụng bất kỳ lúc nào. Phiên bản mới nhất sẽ luôn được đăng tải trên trang này.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    summary:
      "Cách chúng tôi thu thập, lưu trữ và xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Dữ liệu chúng tôi thu thập",
        body: [
          "Họ tên, số điện thoại, email, tên công ty và nội dung yêu cầu mà bạn cung cấp qua các biểu mẫu trên website.",
        ],
      },
      {
        heading: "2. Mục đích sử dụng",
        body: [
          "Dữ liệu được dùng để liên hệ tư vấn, gửi báo giá, xử lý đơn hàng và chăm sóc khách hàng. Chúng tôi không công khai số điện thoại/email của khách hàng.",
        ],
      },
      {
        heading: "3. Cơ sở pháp lý và sự đồng ý",
        body: [
          "Việc xử lý dữ liệu cá nhân tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (có hiệu lực từ 01/7/2023). Chúng tôi chỉ thu thập dữ liệu khi bạn đã đồng ý qua ô xác nhận trên biểu mẫu.",
        ],
      },
      {
        heading: "4. Quyền của chủ thể dữ liệu",
        body: [
          "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình. Vui lòng liên hệ qua email được công bố trong phần Liên hệ.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-thanh-toan",
    title: "Chính sách thanh toán",
    summary:
      "Các hình thức thanh toán và quy trình xác nhận giao dịch (tham chiếu Nghị định 52/2024/NĐ-CP).",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Hình thức thanh toán",
        body: [
          "Chuyển khoản ngân hàng / QR Code, ví điện tử (MoMo, ZaloPay), và cổng thanh toán (VNPay) — sẽ được tích hợp ở giai đoạn bán hàng.",
        ],
      },
      {
        heading: "2. Xác nhận giao dịch",
        body: [
          "Sau khi thanh toán, trạng thái đơn hàng được cập nhật tự động: chờ thanh toán, đã thanh toán, lỗi, hoàn tiền. Khách hàng nhận email/SMS xác nhận.",
        ],
      },
      {
        heading: "3. Bảo mật thanh toán",
        body: [
          "Hoạt động thanh toán không dùng tiền mặt tuân thủ Nghị định 52/2024/NĐ-CP (hiệu lực 01/7/2024). Website không lưu trữ thông tin thẻ nhạy cảm.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-van-chuyen",
    title: "Chính sách vận chuyển",
    summary: "Thời gian, phí và phạm vi giao hàng.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Phạm vi giao hàng",
        body: ["Áp dụng trên toàn quốc thông qua các đối tác vận chuyển uy tín."],
      },
      {
        heading: "2. Thời gian & phí",
        body: [
          "Thời gian giao hàng dự kiến 2–5 ngày làm việc tùy khu vực. Phí vận chuyển được hiển thị tại bước đặt hàng.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    summary: "Điều kiện, quy trình và thời hạn đổi trả.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Điều kiện đổi trả",
        body: [
          "Sản phẩm còn nguyên trạng, đầy đủ hóa đơn và trong thời hạn quy định (thường 7 ngày kể từ khi nhận hàng).",
        ],
      },
      {
        heading: "2. Quy trình",
        body: [
          "Liên hệ bộ phận CSKH để được hướng dẫn. Chi phí và phương thức hoàn tiền tuân theo thỏa thuận tại thời điểm mua hàng.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-bao-hanh",
    title: "Chính sách bảo hành",
    summary: "Điều kiện, thời gian và phạm vi bảo hành.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Phạm vi bảo hành",
        body: [
          "Áp dụng cho lỗi kỹ thuật của sản phẩm/dịch vụ trong thời gian bảo hành công bố tại trang sản phẩm.",
        ],
      },
      {
        heading: "2. Trường hợp không bảo hành",
        body: [
          "Hư hỏng do tác động bên ngoài, sử dụng sai hướng dẫn, hoặc đã hết thời hạn bảo hành.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-khieu-nai",
    title: "Chính sách khiếu nại",
    summary: "Kênh tiếp nhận và thời hạn xử lý khiếu nại.",
    updated: UPDATED,
    sections: [
      {
        heading: "1. Kênh tiếp nhận",
        body: [
          "Khiếu nại được tiếp nhận qua hotline, email hoặc biểu mẫu liên hệ trên website.",
        ],
      },
      {
        heading: "2. Thời hạn xử lý",
        body: [
          "Chúng tôi phản hồi trong vòng 24–48 giờ làm việc và xử lý dứt điểm theo quy định pháp luật.",
        ],
      },
    ],
  },
];

export const getPolicy = (slug: string): Policy | undefined =>
  POLICIES.find((p) => p.slug === slug);
