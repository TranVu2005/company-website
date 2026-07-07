# Phân quyền đa cấp (RBAC) — Giai đoạn 3 (Phần 2D) — Thiết kế

**Ngày:** 2026-07-07
**Nhánh:** feat/nextjs-migration
**Phạm vi:** Thực thi phân quyền theo `Users.roles` (admin/editor/sales/kế toán)
đã có sẵn trong schema nhưng chưa được áp dụng ở bất kỳ đâu — hiện mọi tài
khoản `users` đều có quyền như nhau đối với CRM, Dashboard, Orders/Customers
(trong `/admin`), và (nghiêm trọng hơn) các collection nội dung marketing.

Đây là phần tiếp theo của Giai đoạn 3 sau CRM ([spec](2026-07-06-crm-design.md))
và Dashboard ([spec](2026-07-07-dashboard-design.md)). Các phần còn lại của mục
"Dashboard quản trị" (truy cập/nguồn/tỉ lệ chuyển đổi, tồn kho, nhật ký hệ
thống) và các hạng mục khác của Giai đoạn 3 (Chatbot AI/RAG, gợi ý sản phẩm +
email marketing) nằm ngoài phạm vi spec này.

---

## Bối cảnh & hiện trạng

Stack: Next.js 15 (App Router) + Payload CMS 3.85.1 + Postgres (Neon).

`collections/Users.ts` đã có field `roles` (`select`, `hasMany`, `defaultValue:
["editor"]`, options: `admin`/`editor`/`sales`/`accountant`) nhưng **không có
field này được đọc ở bất kỳ access-control nào trong toàn bộ codebase** — mọi
nơi hiện chỉ kiểm tra `user?.collection === "users"` (là nhân viên nội bộ hay
không), không phân biệt role cụ thể.

Khảo sát phát hiện 2 vấn đề cần xử lý cùng đợt:

1. **`collections/Users.ts` không định nghĩa `access` gì cả** → Payload áp
   dụng mặc định `Boolean(user)` cho `create`/`update`/`delete`/`read`. Hệ
   quả: bất kỳ ai đăng nhập (kể cả tài khoản `customers`) đều tạo được tài
   khoản nhân sự mới qua `POST /api/users`, và bất kỳ nhân viên role thấp nào
   cũng tự `PATCH /api/users/:id` đổi `roles` của mình thành `["admin"]`. Đây
   là lỗ hổng tự-phong-admin — phải khoá thì hệ phân quyền phía dưới mới có
   ý nghĩa.
2. **7 collection nội dung marketing** (`Products`, `Services`, `News`,
   `Team`, `Clients`, `Stats`, `Media`) chỉ định nghĩa `access: { read: () =>
   true }`, để `create`/`update`/`delete` rơi về mặc định `Boolean(user)` của
   Payload — bất kỳ tài khoản đã đăng nhập nào (kể cả `customers`) đều
   tạo/sửa/xoá được các collection này qua REST API.

Chỉ có 1 tài khoản `users` tồn tại trong DB hiện tại (`admin@novatech.demo`,
`roles: ["admin"]`) — không có rủi ro khoá nhầm tài khoản nhân sự đang hoạt
động khi áp dụng thay đổi này.

Quyết định đã chốt với người dùng (ma trận quyền theo role):

| Khu vực | admin | editor | sales | kế toán |
|---|---|---|---|---|
| Content (Products/Services/News/Team/Clients/Stats/Media) — ghi | ✅ | ❌ | ❌ | ❌ |
| CRM (`/admin/crm/*`, `/api/crm/*`) + Leads + CustomerNotes | ✅ | ❌ | ✅ | ❌ |
| Dashboard (`/admin/dashboard`) | ✅ | ❌ | ✅ | ✅ |
| Orders + Customers (đọc/sửa trong `/admin`, không phải trang CRM) | ✅ | ❌ | ✅ | ✅ |

`admin` luôn là superuser (bypass mọi kiểm tra). Role `editor` theo lựa chọn
hiện tại không gắn với năng lực đặc biệt nào — tồn tại sẵn trong schema cho
nhu cầu tương lai, không phải một khoảng trống bị bỏ sót.

Kiến trúc: **Approach A** — một helper `hasRole()` dùng trực tiếp tại từng
điểm kiểm tra quyền (access function / custom view / route / nav component),
không thêm collection hay UI quản lý quyền mới (chỉ có 4 role cố định).

---

## Kiến trúc tổng quan

```
lib/rbac.ts (MỚI)              → type Role, hasRole(user, allowed): boolean

collections/Users.ts            → thêm access (create/update/delete: admin
                                  only; read: mọi nhân viên); field-level lock
                                  riêng cho `roles`
collections/Products.ts         → thêm create/update/delete: hasRole(["admin"])
collections/Services.ts         → thêm create/update/delete: hasRole(["admin"])
collections/News.ts             → thêm create/update/delete: hasRole(["admin"])
collections/Team.ts             → thêm create/update/delete: hasRole(["admin"])
collections/Clients.ts          → thêm create/update/delete: hasRole(["admin"])
collections/Stats.ts            → thêm create/update/delete: hasRole(["admin"])
collections/Media.ts            → thêm create/update/delete: hasRole(["admin"])
collections/Leads.ts            → read: hasRole(["admin","sales"])
collections/CustomerNotes.ts    → read/create/update/delete: hasRole(["admin","sales"])
collections/Customers.ts        → nhánh nội bộ của read/update: hasRole(["admin","sales","accountant"]);
                                  field access segment/segmentOverride: hasRole(["admin","sales"])
collections/Orders.ts           → nhánh nội bộ của read: hasRole(["admin","sales","accountant"])

components/admin/CrmNav.tsx         → ẩn nếu !hasRole(["admin","sales"])
components/admin/DashboardNav.tsx   → ẩn nếu !hasRole(["admin","sales","accountant"])
components/admin/CrmListView.tsx    → guard: hasRole(["admin","sales"])
components/admin/CrmDetailView.tsx  → guard: hasRole(["admin","sales"])
components/admin/DashboardView.tsx  → guard: hasRole(["admin","sales","accountant"])
app/api/crm/segment/route.ts        → guard: hasRole(["admin","sales"])
app/api/crm/segment/auto/route.ts   → guard: hasRole(["admin","sales"])
app/api/crm/note/route.ts           → guard: hasRole(["admin","sales"])
```

Toàn bộ nằm trong runtime Payload/Next.js hiện có — không thêm hạ tầng,
không thêm dependency mới.

---

## Chi tiết từng phần

### 1. `lib/rbac.ts` — helper trung tâm

```ts
import "server-only";

export type Role = "admin" | "editor" | "sales" | "accountant";

type RoleCheckableUser = { collection?: string; roles?: Role[] | null } | null | undefined;

/**
 * true nếu user là tài khoản nội bộ (collection "users") VÀ có role "admin"
 * (luôn bypass) HOẶC có ít nhất 1 role nằm trong `allowed`.
 * KHÔNG dùng hàm này để kiểm tra "là nhân viên nội bộ nói chung, bất kể
 * role" — trường hợp đó dùng thẳng `user?.collection === "users"` (xem
 * Users.access.read bên dưới), vì hasRole(user, []) luôn trả về false cho
 * non-admin.
 */
export function hasRole(user: RoleCheckableUser, allowed: Role[]): boolean {
  if (!user || user.collection !== "users") return false;
  const roles = user.roles || [];
  if (roles.includes("admin")) return true;
  return allowed.some((r) => roles.includes(r));
}
```

### 2. `collections/Users.ts` — khoá tự-phong-admin

```ts
import { hasRole } from "../lib/rbac";
// ...
access: {
  read: ({ req: { user } }) => user?.collection === "users",
  create: ({ req: { user } }) => hasRole(user, []), // chỉ admin (hasRole bypass)
  update: ({ req: { user } }) => hasRole(user, []),
  delete: ({ req: { user } }) => hasRole(user, []),
},
fields: [
  { name: "name", type: "text" },
  {
    name: "roles",
    type: "select",
    hasMany: true,
    defaultValue: ["editor"],
    options: [...],
    access: {
      // Phòng thủ kép: dù access.update ở document-level có bị nới lỏng sau
      // này (vd cho phép nhân viên tự sửa tên mình), field `roles` vẫn luôn
      // chỉ admin ghi được.
      create: ({ req: { user } }) => hasRole(user, []),
      update: ({ req: { user } }) => hasRole(user, []),
    },
  },
],
```

`hasRole(user, [])` chỉ trả `true` khi `roles` chứa `"admin"` (mảng `allowed`
rỗng nên nhánh `allowed.some(...)` luôn `false`) — dùng làm idiom "chỉ admin"
xuyên suốt spec này, ngắn gọn hơn định nghĩa thêm hàm `isAdmin()` riêng.

### 3. 7 collection content — khoá ghi cho admin

Mỗi file (`Products.ts`, `Services.ts`, `News.ts`, `Team.ts`, `Clients.ts`,
`Stats.ts`, `Media.ts`) đổi từ:

```ts
access: { read: () => true },
```

thành:

```ts
access: {
  read: () => true,
  create: ({ req: { user } }) => hasRole(user, []),
  update: ({ req: { user } }) => hasRole(user, []),
  delete: ({ req: { user } }) => hasRole(user, []),
},
```

`Services.ts` hiện khai báo `const publicRead = { read: () => true }` (object
literal cục bộ, chỉ dùng trong file này) rồi gán `access: publicRead` — thêm
`create`/`update`/`delete` trực tiếp vào object `publicRead` đó thay vì viết
lại `access` từ đầu.

### 4. Leads / CustomerNotes / Customers / Orders — role cụ thể

- `Leads.ts`: `read: ({req:{user}}) => hasRole(user, ["admin","sales"])`
  (giữ nguyên `create: () => true` cho form công khai). Việc này đồng thời
  đóng finding bảo mật đã spawn riêng trước đó (Leads.read quá lỏng cho mọi
  nhân viên) — sẽ dismiss task nền đó vì được xử lý ở đây.
- `CustomerNotes.ts`: cả 4 operation đổi từ `user?.collection === "users"`
  thành `hasRole(user, ["admin","sales"])`.
- `Customers.ts`: nhánh nội bộ trong `read`/`update` (hiện là `if
  (user.collection === "users") return true;`) đổi thành `if (hasRole(user,
  ["admin","sales","accountant"])) return true;`. Field access của
  `segment`/`segmentOverride` đổi từ `user?.collection === "users"` thành
  `hasRole(user, ["admin","sales"])` cho cả `create` và `update` (giữ khoá
  kép đã có từ bản vá Critical của CRM).
- `Orders.ts`: nhánh nội bộ trong `read` đổi tương tự thành
  `hasRole(user, ["admin","sales","accountant"])`. `create` giữ nguyên
  `Boolean(user)` — khách hàng tự đặt đơn không thay đổi.

### 5. CRM + Dashboard — custom view, route, nav

- `CrmListView.tsx`, `CrmDetailView.tsx`: đổi guard từ `req.user?.collection
  !== "users"` thành `!hasRole(req.user, ["admin","sales"])`.
- `DashboardView.tsx`: đổi guard thành `!hasRole(req.user,
  ["admin","sales","accountant"])`.
- `app/api/crm/segment/route.ts`, `segment/auto/route.ts`, `note/route.ts`:
  đổi điều kiện 403 từ `user.collection !== "users"` thành `!hasRole(user,
  ["admin","sales"])`.
- `CrmNav.tsx`, `DashboardNav.tsx`: hiện là component tĩnh không nhận prop.
  Payload truyền `ServerProps` (gồm `user`) cho mọi component đăng ký qua
  `admin.components.beforeNavLinks` (xác nhận tại
  `node_modules/@payloadcms/next/dist/elements/Nav/index.js:108-124`). Đổi
  cả 2 thành nhận `{ user }: ServerProps` từ `payload` package, trả về
  `null` nếu không đủ quyền tương ứng, ngược lại render link như cũ.

---

## Bảo mật

1. **Tự-phong-admin (Critical)**: `Users.access` (create/update/delete) +
   field-level lock riêng cho `roles` — cả hai cùng chặn, giống mô hình khoá
   kép đã áp dụng cho `Customers.segment`.
2. **Content bị ghi bậy bởi tài khoản bất kỳ**: 7 collection content thêm
   `create`/`update`/`delete` chỉ-admin.
3. **CRM/Leads/CustomerNotes/Dashboard/Orders/Customers**: đúng ma trận role
   đã chốt, thực thi ở cả tầng collection access, custom view, và route
   handler (defense-in-depth nhất quán với mô hình CRM đã có).
4. **Nav ẩn đúng quyền**: giảm khả năng nhân viên role thấp nhìn thấy link
   dẫn tới trang họ sẽ bị chặn (UX, không phải rào chắn bảo mật — chặn thật
   vẫn ở guard trong view/route).

---

## Kế hoạch kiểm thử (Verify)

Chạy trên dev server, tạo tài khoản test cho từng role rồi dọn sau khi xong:

1. **Tự-phong-admin**: đăng nhập role `sales` (không phải admin), PATCH
   `/api/users/:id` với `roles:["admin"]` (là chính mình) → giữ nguyên role
   cũ, không đổi thành admin.
2. **Tạo tài khoản nhân sự công khai**: `POST /api/users` không đăng nhập,
   hoặc đăng nhập bằng tài khoản `customers` → 403.
3. **Content**: đăng nhập role `sales`/`editor`/`accountant` (không phải
   admin), `POST /api/products` → 403. Đăng nhập `admin` → thành công.
   `GET /api/products` (không đăng nhập) vẫn công khai như cũ.
4. **CRM**: role `editor`/`accountant` truy cập `/admin/crm` → thấy thông báo
   không có quyền; role `sales`/`admin` → vào được, nav "CRM" chỉ hiện với 2
   role này.
5. **Dashboard**: role `editor` → không vào được `/admin/dashboard`; role
   `sales`/`accountant`/`admin` → vào được, nav "Dashboard" hiện đúng.
6. **Orders/Customers trong `/admin`**: role `editor` không đọc được
   `/api/orders`/`/api/customers` (nhánh nội bộ); `sales`/`accountant`/
   `admin` đọc được.
7. **Không phá luồng khách hàng**: khách tự đăng ký/tự sửa hồ sơ/tự đặt đơn
   không đổi hành vi (các nhánh đó không dùng `hasRole`).
8. **Regression**: `npx tsc --noEmit` sạch; đăng nhập `admin@novatech.demo`
   vẫn full quyền mọi nơi như trước.

---

## Ngoài phạm vi (YAGNI)

- UI quản lý phân quyền tùy biến (gán role/quyền qua giao diện) — 4 role cố
  định trong schema hiện tại là đủ.
- Phân quyền theo phạm vi dữ liệu (vd: sales chỉ thấy khách hàng do mình phụ
  trách) — chưa có field "người phụ trách" trong schema Customers/Orders.
- Nhật ký hệ thống (audit log ai đổi quyền ai) — thuộc phần E của "Dashboard
  quản trị", spec riêng khi tới lượt.
- Field `access.update` cho phép nhân viên tự sửa hồ sơ của chính mình
  (name/password) mà không cần role admin — hiện `Users.update` khoá hoàn
  toàn cho admin để giữ đơn giản; nếu cần self-service sau này sẽ mở rộng
  document-level access riêng cho trường hợp `id === req.user.id` (field
  `roles` vẫn khoá qua field-level access).
