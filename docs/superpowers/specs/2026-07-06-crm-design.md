# CRM — Giai đoạn 3 (Phần 1) — Thiết kế

**Ngày:** 2026-07-06
**Nhánh:** feat/nextjs-migration
**Phạm vi:** Xây năng lực CRM cơ bản: phân nhóm khách hàng tự động, dòng thời gian
360° (lead + đơn hàng + ghi chú sales) cho từng khách, ngay bên trong trang quản
trị Payload có sẵn (`/admin`).

Đây là phần đầu tiên của Giai đoạn 3 trong [KE_HOACH_NANG_CAP.md](../../../KE_HOACH_NANG_CAP.md).
Các phần còn lại của Giai đoạn 3 (Dashboard số liệu, Chatbot AI/RAG, gợi ý sản
phẩm, email marketing) nằm ngoài phạm vi spec này và sẽ có spec riêng.

---

## Bối cảnh & hiện trạng

Stack: Next.js 15 (App Router) + Payload CMS 3.85.1 + Postgres (Neon).

Dữ liệu liên quan đã có sẵn:
- `collections/Customers.ts` — tài khoản khách hàng (auth: true; field `name`,
  `phone`, email). Access control: khách chỉ đọc/sửa chính mình, admin
  (`user.collection === "users"`) toàn quyền.
- `collections/Orders.ts` — đơn hàng, bắt buộc có `customer` (relationship tới
  customers), `total`, `paymentStatus` (unpaid/paid/failed/refunded), `status`.
- `collections/Leads.ts` — lead từ form liên hệ (name, email, phone, company,
  subject, message, status, notes). **Không** liên kết với Customers; chỉ có email
  làm điểm chung.
- `collections/Users.ts` — tài khoản nội bộ (admin/editor/sales/accountant qua
  field `roles`).

Payload admin (`/admin`) đã chạy, đăng nhập bằng tài khoản `users`. Payload
3.85.1 hỗ trợ **custom admin view** qua `admin.components.views` — một React
Server Component nằm trong khung `/admin`, tự thừa hưởng đăng nhập/phân quyền
admin (chưa đăng nhập admin sẽ bị đá về trang login của Payload).

Quyết định đã chốt với người dùng:
- Phân nhóm dựa trên **tổng chi tiêu + số đơn** (đơn đã thanh toán).
- Lead ↔ Customer: **tự liên kết theo email** lúc hiển thị, không đổi schema Leads.
- Admin **được ghi đè tay** nhãn nhóm; khi đã ghi đè thì không tự tính lại.
- Sales **được thêm ghi chú thủ công** vào lịch sử liên hệ của từng khách.
- Giao diện: **Custom View gắn trong `/admin`** (phương án C).

---

## Kiến trúc tổng quan

```
collections/Customers.ts   → thêm field: segment, segmentOverride (field-level
                             access: chỉ admin ghi được)
collections/CustomerNotes.ts (MỚI) → ghi chú/hoạt động sales
collections/Orders.ts      → thêm hook afterChange + afterDelete gọi tính lại segment

lib/crm.ts (MỚI)           → recomputeSegment(customerId): tính & lưu segment
                             getCustomerTimeline(customerId): gộp lead+đơn+ghi chú

components/admin/CrmListView.tsx   (MỚI) → Server Component: danh sách khách + lọc theo nhóm
components/admin/CrmDetailView.tsx (MỚI) → Server Component: dòng thời gian 360° 1 khách
components/admin/CrmNav.tsx        (MỚI) → link "CRM" thêm vào sidebar admin

payload.config.ts          → đăng ký CustomNotes collection, custom views, nav link
```

Toàn bộ nằm trong runtime Payload/Next.js hiện có, dùng Local API
(`getPayload({config})`) — không thêm hạ tầng mới.

---

## Chi tiết từng phần

### 1. Mô hình dữ liệu

**Customers — thêm 2 field:**

```ts
{
  name: "segment",
  type: "select",
  defaultValue: "new",
  options: [
    { label: "Mới", value: "new" },
    { label: "Tiềm năng", value: "potential" },
    { label: "VIP", value: "vip" },
  ],
  access: {
    // Chỉ tài khoản nội bộ (users) mới ghi được. Chặn ở MỨC FIELD nên kể cả
    // khách tự craft request PATCH /api/customers/:id chính mình cũng không
    // sửa được nhóm của bản thân (access document-level của Customers cho phép
    // khách sửa chính mình, nên bắt buộc phải chặn thêm ở field-level).
    update: ({ req: { user } }) => user?.collection === "users",
  },
},
{
  name: "segmentOverride",
  type: "checkbox",
  defaultValue: false,
  label: "Ghi đè nhóm thủ công",
  admin: { description: "Khi bật, hệ thống không tự tính lại nhóm theo doanh số." },
  access: {
    update: ({ req: { user } }) => user?.collection === "users",
  },
},
```

**CustomerNotes — collection mới:**

```ts
{
  slug: "customer-notes",
  admin: { useAsTitle: "content", defaultColumns: ["customer","type","author","createdAt"] },
  access: {
    // Chỉ nội bộ; khách hàng KHÔNG bao giờ đọc/ghi ghi chú nội bộ về mình.
    read:   ({ req: { user } }) => user?.collection === "users",
    create: ({ req: { user } }) => user?.collection === "users",
    update: ({ req: { user } }) => user?.collection === "users",
    delete: ({ req: { user } }) => user?.collection === "users",
  },
  fields: [
    { name: "customer", type: "relationship", relationTo: "customers", required: true },
    { name: "type", type: "select", defaultValue: "note", options: [
      { label: "Ghi chú", value: "note" },
      { label: "Gọi điện", value: "call" },
      { label: "Gặp mặt", value: "meeting" },
      { label: "Email", value: "email" },
      { label: "Khác", value: "other" },
    ]},
    { name: "content", type: "textarea", required: true },
    { name: "author", type: "relationship", relationTo: "users",
      // Tự gán người đang đăng nhập, không cho sửa tay.
      admin: { readOnly: true },
      hooks: { beforeChange: [({ req, value }) => value ?? req.user?.id] } },
  ],
}
```

### 2. Logic tự động phân nhóm — `lib/crm.ts`

```
recomputeSegment(customerId):
  1. Đọc customer. Nếu segmentOverride === true → return (không đụng vào).
  2. Đọc mọi order của customer có paymentStatus === "paid".
  3. total = tổng order.total; count = số order.
  4. segment =
        count === 0                        → "new"
        total >= 5_000_000 || count >= 3   → "vip"
        else                               → "potential"
  5. Nếu khác giá trị hiện tại → payload.update segment.
```

Ngưỡng (5.000.000đ, 3 đơn) đặt thành hằng số ở đầu file để chỉnh dễ.

**Kích hoạt:** Orders hook
- `afterChange`: gọi `recomputeSegment(order.customer)` — bắt mọi thay đổi
  paymentStatus (kể cả khi webnhook thanh toán cập nhật "paid").
- `afterDelete`: cũng gọi để cập nhật khi xoá đơn.

Hook chạy "fire-and-forget" có bọc try/catch — lỗi tính segment không được làm
hỏng việc lưu đơn hàng (đơn hàng quan trọng hơn nhãn CRM).

**Tránh vòng lặp:** `recomputeSegment` chỉ `payload.update` collection
`customers`, không đụng `orders`, nên không kích hoạt lại hook Orders. Việc update
customers cũng không có hook nào gọi ngược lại orders.

### 3. Dòng thời gian 360° — `getCustomerTimeline(customerId)` trong `lib/crm.ts`

Trả về mảng sự kiện đã trộn & sắp theo thời gian giảm dần:

```
type TimelineEvent = {
  kind: "lead" | "order" | "note";
  date: string;              // ISO
  title: string;             // vd "Đơn NVT-... — 2.500.000đ (Đã thanh toán)"
  detail?: string;
  status?: string;
  href?: string;             // link tới bản ghi gốc trong admin
};
```

Nguồn:
- **Orders**: `where: { customer: { equals: id } }`.
- **Notes**: `where: { customer: { equals: id } }`, populate author.
- **Leads**: `where: { email: { equals: customer.email } }` — liên kết mềm theo
  email (không có field quan hệ). Nếu khách đổi email thì lead cũ theo email cũ
  sẽ không hiện — chấp nhận được ở phạm vi này.

### 4. Giao diện — Custom Views trong `/admin`

Đăng ký trong `payload.config.ts`:

```ts
admin: {
  components: {
    views: {
      crmList:   { Component: "/components/admin/CrmListView#CrmListView",   path: "/crm" },
      crmDetail: { Component: "/components/admin/CrmDetailView#CrmDetailView", path: "/crm/:id" },
    },
    beforeNavLinks: ["/components/admin/CrmNav#CrmNav"],
  },
}
```

**CrmListView** (Server Component):
- Nhận `initPageResult.req` (đã xác thực) — nếu `req.user?.collection !== "users"`
  thì render thông báo không có quyền (dù khung admin đã chặn non-user, vẫn phòng
  thủ). Dùng chính `req.payload` để query.
- Lấy toàn bộ customers (limit hợp lý, vd 200; phân trang cơ bản qua query param
  nếu cần), với mỗi khách tính tổng chi tiêu + số đơn (đơn đã thanh toán).
  *Lưu ý hiệu năng:* để tránh N+1, đọc toàn bộ paid orders 1 lần rồi gộp theo
  customer trong JS.
- Hiển thị bảng: Tên · Email · SĐT · Nhóm (badge màu) · Tổng chi tiêu · Số đơn.
  Lọc theo nhóm qua query param `?segment=vip`. Sắp xếp theo chi tiêu giảm dần.
  Mỗi hàng link tới `/admin/crm/:id`.

**CrmDetailView** (Server Component):
- Đọc `params.id`, load customer + `getCustomerTimeline`.
- Hiển thị: thông tin khách + badge nhóm; ô "Ghi đè nhóm" (form → Server Action
  hoặc route handler cập nhật segment + segmentOverride); form "Thêm ghi chú"
  (type + content → tạo customer-note); dòng thời gian gộp.
- Các form submit tới **route handler nội bộ** `app/api/crm/*` (xác thực lại bằng
  `payload.auth({headers})`, yêu cầu `user.collection === "users"`), rồi
  `revalidatePath`/redirect về trang chi tiết. Không tin client.

**CrmNav**: link "CRM" trỏ `/admin/crm`, chỉ hiện với tài khoản nội bộ.

### 5. Route handlers hỗ trợ (MỚI, dưới `app/api/crm/`)

- `POST /api/crm/segment` — body `{ customerId, segment }` → set
  `segment` + `segmentOverride: true`. Yêu cầu user nội bộ.
- `POST /api/crm/segment/auto` — body `{ customerId }` → tắt override
  (`segmentOverride: false`) rồi `recomputeSegment` để quay lại tự động.
- `POST /api/crm/note` — body `{ customerId, type, content }` → tạo customer-note
  (author = user hiện tại). Yêu cầu user nội bộ.

Tất cả xác thực bằng `payload.auth({ headers })`, chặn nếu không phải `users`.

---

## Bảo mật (đã cân nhắc)

1. **Khách tự phong VIP**: chặn ở field-level access của `segment`/
   `segmentOverride` (chỉ `users` ghi được) — vì document-level access của
   Customers vốn cho khách sửa chính mình.
2. **Ghi chú nội bộ lộ cho khách**: collection `customer-notes` chặn read với
   mọi non-user.
3. **Route `/api/crm/*`**: đều `payload.auth` + kiểm tra `collection === "users"`.
4. **Custom view**: khung `/admin` tự chặn chưa-đăng-nhập; view vẫn tự kiểm tra
   `req.user.collection === "users"` để phòng thủ.

---

## Kế hoạch kiểm thử (Verify)

Chạy trên dev server + Local/REST API, dọn sạch dữ liệu test sau khi xong:

1. **Tự phân nhóm**:
   - Khách mới chưa mua → `segment = new`.
   - Tạo + đánh dấu paid 1 đơn 2.000.000đ → `potential`.
   - Nâng lên tổng ≥ 5.000.000đ (hoặc ≥ 3 đơn) → `vip`.
2. **Ghi đè tay**: set VIP thủ công cho khách mới (0 đơn) → giữ VIP; thêm/sửa đơn
   → vẫn VIP (không bị tính lại). Bấm "về tự động" → tính lại đúng.
3. **Timeline**: gửi 1 lead trùng email khách có tài khoản → xuất hiện trong dòng
   thời gian cùng đơn hàng + ghi chú, đúng thứ tự thời gian.
4. **Ghi chú**: sales thêm ghi chú "đã gọi điện" → hiện trong timeline, author
   đúng người đăng nhập.
5. **Bảo mật**:
   - Đăng nhập bằng tài khoản khách, PATCH `/api/customers/:id` (chính mình) với
     `segment: "vip"` → segment KHÔNG đổi.
   - Gọi `/api/crm/*` khi chưa đăng nhập admin → 401.
   - Khách gọi `GET /api/customer-notes` → không thấy ghi chú (403/rỗng).
6. **Admin panel không vỡ**: `/admin` các collection cũ vẫn vào được; link CRM
   hiện trong sidebar; `npx tsc --noEmit` sạch.

---

## Ngoài phạm vi (YAGNI)

- Dashboard số liệu tổng hợp (truy cập, tỉ lệ chuyển đổi, doanh thu theo thời
  gian) — phần khác của Giai đoạn 3.
- Tự động gán lead → customer bằng field quan hệ (chỉ liên kết mềm theo email).
- Email marketing tự động, gợi ý sản phẩm, chatbot AI.
- Phân quyền chi tiết theo vai trò (admin/sales/kế toán) cho từng thao tác CRM —
  hiện gộp chung "tài khoản nội bộ (users)". Có thể siết theo `roles` ở phần sau.
- Phân trang nâng cao / tìm kiếm full-text trong danh sách CRM (chỉ lọc theo nhóm
  + sắp xếp cơ bản).
