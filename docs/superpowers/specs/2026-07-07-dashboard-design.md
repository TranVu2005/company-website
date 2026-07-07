# Dashboard quản trị — Giai đoạn 3 (Phần 2A) — Thiết kế

**Ngày:** 2026-07-07
**Nhánh:** feat/nextjs-migration
**Phạm vi:** Dashboard đơn hàng/doanh thu + sản phẩm bán chạy, hiển thị ngay
trong trang quản trị Payload có sẵn (`/admin`), theo cùng mô hình Custom View
đã dùng cho CRM.

Đây là lát cắt đầu tiên của mục "Dashboard quản trị" trong Giai đoạn 3 (xem
[KE_HOACH_NANG_CAP.md](../../../KE_HOACH_NANG_CAP.md)). Mục này ban đầu gộp 5
nhóm năng lực có mức độ sẵn sàng hạ tầng rất khác nhau: (A) đơn/doanh thu +
bán chạy, (B) truy cập/nguồn/tỉ lệ chuyển đổi, (C) tồn kho + cảnh báo, (D)
phân quyền đa cấp, (E) nhật ký hệ thống. Spec này **chỉ** làm phần A; B–E cần
hạ tầng mới (tracking, field tồn kho, enforce roles, audit log tương ứng) và
sẽ có spec riêng khi tới lượt.

---

## Bối cảnh & hiện trạng

Stack: Next.js 15 (App Router) + Payload CMS 3.85.1 + Postgres (Neon).

Dữ liệu liên quan đã có sẵn trong `collections/Orders.ts`:
- `paymentStatus`: `unpaid` / `paid` / `failed` / `refunded`.
- `total` (number), `createdAt` (tự động).
- `items`: mảng nhúng (không phải relationship) gồm `productId`, `productName`,
  `quantity`, `price` — vì là field nhúng dạng text/number thuần, không có vấn
  đề Payload tự populate quan hệ (khác với `customer` trong CRM, nơi từng gặp
  lỗi vì `depth` mặc định).
- **Không có** field nào đánh dấu "thời điểm thanh toán" riêng — chỉ có
  `createdAt` (thời điểm tạo đơn).

Đã xác nhận không có gì phải xây thêm cho phần A: `collections/Stats.ts` chỉ
phục vụ các thẻ số liệu tĩnh ở trang chủ marketing (không liên quan); không có
field tồn kho trong `collections/Products.ts`; `components/Analytics.tsx` chỉ
gắn script GA4/GTM/Meta Pixel (dữ liệu truy cập nằm ở bên thứ 3, ứng dụng
không lưu).

Quyết định đã chốt với người dùng:
- Chỉ tính đơn có `paymentStatus === "paid"`.
- Bộ lọc thời gian: 3 nút nhanh **Hôm nay / 7 ngày / 30 ngày** (không cần date
  picker tự chọn).
- Có biểu đồ xu hướng doanh thu theo ngày.
- Quyền truy cập: giống CRM — mọi tài khoản nội bộ (`users`), chưa phân theo
  vai trò (roles) trong lát cắt này.
- Bán chạy: xếp hạng theo **số lượng bán**, hiển thị **Top 5**.
- Kiến trúc: **Phương án A** — Custom View tính số liệu trực tiếp từ Orders
  mỗi lần tải trang (real-time, không thêm hạ tầng/collection/dependency mới),
  cùng mô hình với CRM.

---

## Kiến trúc tổng quan

```
lib/dashboard.ts (MỚI)              → getDashboardMetrics(payload, range): tính
                                       doanh thu/số đơn/AOV/xu hướng theo ngày/
                                       top 5 sản phẩm bán chạy

components/admin/DashboardView.tsx (MỚI) → Server Component: hiển thị số liệu
components/admin/DashboardNav.tsx  (MỚI) → link "Dashboard" thêm vào sidebar

payload.config.ts                   → đăng ký custom view + nav link (nối
                                       tiếp views/beforeNavLinks đã có của CRM)
```

Không thêm collection, không thêm route API (view tự query qua
`initPageResult.req.payload`, không có form submit nào cần xử lý phía server
riêng), không thêm npm dependency (biểu đồ vẽ tay bằng SVG, giống phong cách
zero-dependency của CRM).

---

## Chi tiết từng phần

### 1. Tính khoảng thời gian

Query param `?range=today|7d|30d`, mặc định `7d` khi thiếu/sai giá trị.

```ts
function getRangeBounds(range: string): { start: Date; end: Date; days: number } {
  // "today": 00:00 hôm nay → hiện tại (days = 1)
  // "7d":    00:00 của (hôm nay - 6 ngày) → hiện tại (days = 7)
  // "30d":   00:00 của (hôm nay - 29 ngày) → hiện tại (days = 30)
}
```

Mốc ngày dùng giờ server (không xử lý timezone người dùng — nhất quán với
cách các trang admin khác trong dự án đang hiển thị `createdAt`).

### 2. Tính số liệu — `lib/dashboard.ts`

```ts
export type DashboardMetrics = {
  range: "today" | "7d" | "30d";
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  dailyTrend: { date: string; total: number }[]; // 1 phần tử/ngày, kể cả ngày 0 đơn
  topProducts: { productId: string; productName: string; quantitySold: number }[]; // top 5
};

export async function getDashboardMetrics(payload: Payload, range: string): Promise<DashboardMetrics> {
  const { start, end, days } = getRangeBounds(range);
  const paidOrders = await payload.find({
    collection: "orders",
    where: {
      paymentStatus: { equals: "paid" },
      createdAt: { greater_than_equal: start.toISOString(), less_than_equal: end.toISOString() },
    },
    limit: 0,
    depth: 0, // phòng thủ — items là mảng nhúng nên không thực sự cần, nhưng nhất quán với CrmListView
  });

  // Gộp 1 lượt duy nhất trong JS: tổng doanh thu, số đơn, doanh thu theo ngày,
  // số lượng bán theo productId — không N+1 query.
  ...
  const topProducts = [...quantityByProduct.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  return { range, totalRevenue, orderCount, averageOrderValue, dailyTrend, topProducts };
}
```

**Giới hạn đã cân nhắc và chấp nhận:** dùng `createdAt` (thời điểm tạo đơn)
thay vì "thời điểm thanh toán" vì Orders không có field riêng cho việc này.
Với luồng thanh toán hiện tại (VNPay/MoMo/ZaloPay callback cập nhật
`paymentStatus` gần như ngay khi tạo đơn), sai lệch không đáng kể ở phạm vi
ngày. Nếu sau này cần độ chính xác cao hơn, có thể thêm field `paidAt` — nằm
ngoài phạm vi spec này.

`averageOrderValue = orderCount === 0 ? 0 : totalRevenue / orderCount` (tránh
chia 0).

### 3. Giao diện — `DashboardView.tsx`

Đăng ký trong `payload.config.ts`, nối tiếp block `views`/`beforeNavLinks`
hiện có của CRM:

```ts
admin: {
  components: {
    views: {
      crmList: { ... },
      crmDetail: { ... },
      dashboard: { Component: "/components/admin/DashboardView#DashboardView", path: "/dashboard", exact: true },
    },
    beforeNavLinks: ["/components/admin/CrmNav#CrmNav", "/components/admin/DashboardNav#DashboardNav"],
  },
}
```

**DashboardView** (Server Component):
- Guard `req.user?.collection !== "users"` → thông báo không có quyền (giống
  CRM, phòng thủ dù khung `/admin` đã chặn non-user).
- Đọc `searchParams.range`, gọi `getDashboardMetrics`.
- 3 link lọc khoảng thời gian (Hôm nay / 7 ngày / 30 ngày), link đang chọn
  được đánh dấu.
- 3 thẻ số liệu: **Doanh thu** · **Số đơn** · **Giá trị đơn trung bình**
  (định dạng theo `toLocaleString("vi-VN")`, đơn vị đ).
- Biểu đồ cột doanh thu theo ngày, vẽ bằng SVG thuần (trục đơn giản, không có
  thư viện). Với range "today" (1 điểm dữ liệu), hiển thị dạng thẻ số liệu
  thay vì biểu đồ cột (biểu đồ 1 cột không có ý nghĩa so sánh).
- Bảng Top 5 sản phẩm bán chạy: Tên sản phẩm · Số lượng bán, sắp giảm dần. Nếu
  không có đơn nào trong khoảng → thông báo "Chưa có dữ liệu".

**DashboardNav**: link tĩnh `<a href="/admin/dashboard">Dashboard</a>`, không
cần props (giống `CrmNav`).

---

## Bảo mật

Không có gì mới ngoài pattern đã dùng cho CRM:
1. View nằm trong khung `/admin` — Payload tự chặn truy cập khi chưa đăng
   nhập.
2. `DashboardView` tự kiểm tra `req.user.collection === "users"` để phòng thủ
   thêm (đồng nhất với `CrmListView`/`CrmDetailView`).
3. Không có route API mới nên không có bề mặt tấn công mới ở tầng HTTP — toàn
   bộ truy vấn chạy qua `req.payload` (Local API, đã xác thực từ khung admin).

---

## Kế hoạch kiểm thử (Verify)

Chạy trên dev server, dọn dữ liệu test sau khi xong:

1. **Số liệu cơ bản**: tạo vài đơn `paid` với `total` và `createdAt` khác nhau
   (rải trong 1/7/30 ngày gần đây) → xác nhận doanh thu/số đơn/AOV đúng cho cả
   3 khoảng lọc.
2. **Loại trừ đơn chưa thanh toán**: đơn `unpaid`/`failed`/`refunded`/
   `cancelled` không được tính vào doanh thu hay số đơn.
3. **Biểu đồ xu hướng**: đủ số điểm dữ liệu theo từng khoảng (7 điểm cho "7
   ngày", 30 điểm cho "30 ngày"), kể cả ngày không có đơn nào (giá trị 0, không
   bị bỏ qua).
4. **Top 5 sản phẩm**: tạo đơn với nhiều sản phẩm, số lượng khác nhau → xác
   nhận thứ tự xếp hạng đúng theo tổng số lượng bán trong khoảng đang xem (đổi
   khoảng lọc → thứ tự có thể đổi theo).
5. **Trường hợp rỗng**: khoảng thời gian không có đơn `paid` nào → số liệu về
   0, bảng top sản phẩm hiện "Chưa có dữ liệu", không lỗi.
6. **Bảo mật**: đăng nhập bằng tài khoản khách (`customers`) hoặc chưa đăng
   nhập → không truy cập được `/admin/dashboard` (bị chặn ở khung admin hoặc
   thấy thông báo không có quyền).
7. **Không vỡ admin cũ**: link "Dashboard" hiện đúng trong sidebar cạnh "CRM";
   các trang admin khác vẫn vào được; `npx tsc --noEmit` sạch.

---

## Ngoài phạm vi (YAGNI)

- Truy cập/nguồn traffic/tỉ lệ chuyển đổi (phần B) — cần tích hợp GA4 API hoặc
  hạ tầng tracking riêng.
- Tồn kho + cảnh báo (phần C) — cần thêm field tồn kho vào `Products`.
- Phân quyền đa cấp cho Dashboard (phần D) — hiện dùng chung "tài khoản nội
  bộ" như CRM; `Users.roles` đã tồn tại nhưng chưa được enforce ở đâu cả.
- Nhật ký hệ thống/audit log (phần E) — cần thiết kế lưu trữ riêng.
- Date picker tự chọn khoảng ngày, export báo cáo (CSV/PDF), so sánh giữa 2
  khoảng thời gian.
- Field `paidAt` riêng cho thời điểm thanh toán thực tế (xem giới hạn đã nêu ở
  mục Tính số liệu).
