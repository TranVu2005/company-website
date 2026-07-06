# CRM (Giai đoạn 3 — Phần 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic customer segmentation (new/potential/vip), a 360° customer timeline (leads + orders + sales notes), and a staff-only CRM UI mounted as a custom view inside the existing Payload `/admin`.

**Architecture:** Two new fields on `Customers` (`segment`, `segmentOverride`, both field-level write-locked to internal `users`), a new `CustomerNotes` collection (fully staff-only), an `Orders` lifecycle hook that recomputes segment on paid-order changes, a `lib/crm.ts` module with the segment/timeline logic, three staff-only route handlers under `app/api/crm/*`, and two Payload custom admin views (`CrmListView`, `CrmDetailView`) plus a nav link — all rendered inside `/admin`, which already requires a `users` session.

**Tech Stack:** Next.js 15 (App Router) + Payload CMS 3.85.1 (Local API) + Postgres (Neon). No dedicated test runner exists in this repo (see Global Constraints).

**Spec:** [docs/superpowers/specs/2026-07-06-crm-design.md](../specs/2026-07-06-crm-design.md)

## Global Constraints

- No automated test framework (no jest/vitest/pytest) is installed in this repo — `package.json` only has `dev`/`build`/`start`/`lint` scripts. Verification in this plan therefore uses **`npx tsc --noEmit`** (must be clean after every task) plus **manual curl checks against the running dev server**, mirroring how every prior feature in this project was verified.
- Dev server: start via the Preview tool (`npm run dev`, Next.js on `localhost:3000`). Whenever `payload.config.ts` changes (new collection registered, new admin views), the dev server's cached Payload instance must be restarted — a Fast Refresh is NOT enough. Stop the server, then start it again.
- Whenever `admin.components.*` in `payload.config.ts` changes (new/changed custom view or nav component), regenerate the import map: `npx payload generate:importmap`, which rewrites `app/(payload)/admin/importMap.js`. Do this before starting/restarting the dev server.
- All new internal routes/collections must re-check `user.collection === "users"` server-side — never trust that `/admin` gating alone is sufficient (matches the spec's defense-in-depth requirement).
- Segment thresholds are exact values from the spec: VIP if `total paid >= 5,000,000` OR `paid order count >= 3`; `potential` if `paid order count >= 1` and below VIP; `new` if `paid order count === 0`. Only orders with `paymentStatus === "paid"` count.
- Clean up any test customers/orders/notes created during manual verification (delete via REST as the `users` admin) before marking a task done — established project convention this whole session.
- Admin login for manual verification: `admin@novatech.demo` / `admin123456` (existing seeded `users` account).
- Do not commit `.next` or any `docs/superpowers/plans` scratch artifacts. Commit only the source files each task touches, plus this plan file's checkbox updates if the workflow being used tracks that in-repo (subagent-driven-development keeps checkboxes in the conversation, not the file — skip re-committing the plan unless the chosen execution skill says otherwise).

---

## File Structure

```
collections/Customers.ts        MODIFY  add segment, segmentOverride fields (field-level access locked)
collections/CustomerNotes.ts    CREATE  staff-only sales notes/activity log
collections/Orders.ts           MODIFY  add afterChange/afterDelete hooks -> recomputeSegment
lib/crm.ts                      CREATE  computeSegmentForOrders, recomputeSegment, getCustomerTimeline, TimelineEvent
payload.config.ts               MODIFY  register CustomerNotes, custom admin views, nav link
app/api/crm/segment/route.ts        CREATE  POST: manual segment override
app/api/crm/segment/auto/route.ts   CREATE  POST: clear override + recompute
app/api/crm/note/route.ts           CREATE  POST: create a CustomerNote
components/admin/CrmNav.tsx         CREATE  "CRM" link in admin sidebar
components/admin/CrmListView.tsx    CREATE  customer list + segment filter (Server Component)
components/admin/CrmDetailView.tsx  CREATE  one customer's timeline + note form + override control (Server Component)
```

---

## Task 1: Customers — segment fields with field-level write lock

**Files:**
- Modify: `collections/Customers.ts`
- Test: manual curl against dev server (no test framework — see Global Constraints)

**Interfaces:**
- Produces: `Customers` documents now carry `segment: "new" | "potential" | "vip"` (default `"new"`) and `segmentOverride: boolean` (default `false`). Both fields are readable by anyone who can read the customer, but **only writable when `req.user.collection === "users"`** — this exact predicate is reused verbatim in every later task.

- [ ] **Step 1: Add the two fields to `collections/Customers.ts`**

Open `collections/Customers.ts`. The `fields` array currently ends with the `phone` field (line 32) before the closing `],` (line 33). Insert two new field objects after `phone` and before the closing bracket:

```ts
    { name: "name", type: "text", required: true, label: "Họ tên" },
    { name: "phone", type: "text", label: "Số điện thoại" },
    {
      name: "segment",
      type: "select",
      defaultValue: "new",
      label: "Nhóm khách hàng",
      options: [
        { label: "Mới", value: "new" },
        { label: "Tiềm năng", value: "potential" },
        { label: "VIP", value: "vip" },
      ],
      access: {
        // Chỉ tài khoản nội bộ (users) mới ghi được field này. Document-level
        // access của Customers cho phép khách tự sửa hồ sơ của mình, nên nếu
        // không chặn riêng ở đây thì một khách có thể tự PATCH segment:"vip".
        update: ({ req: { user } }) => user?.collection === "users",
      },
    },
    {
      name: "segmentOverride",
      type: "checkbox",
      defaultValue: false,
      label: "Ghi đè nhóm thủ công",
      admin: {
        description: "Khi bật, hệ thống không tự tính lại nhóm theo doanh số.",
      },
      access: {
        update: ({ req: { user } }) => user?.collection === "users",
      },
    },
  ],
};
```

(The existing `name`/`phone` lines are shown only for anchoring — do not duplicate them, just append the two new field objects after `phone` and keep the single closing `],\n};`.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Restart the dev server and verify the default value + field-level lock**

Restart the dev server (Payload caches collection config at init, so a plain Fast Refresh won't pick up new fields reliably — stop and start it).

Register a throwaway test customer via the public REST endpoint:

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"CRM Test 1","email":"crmtest1@example.com","password":"TestPass123"}'
```

Expected: JSON response with `doc.segment === "new"` and `doc.segmentOverride === false`.

Log in as that customer and capture the token:

```bash
curl -s -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"crmtest1@example.com","password":"TestPass123"}'
```

Copy `token` and the customer's `id` (or `user.id`) from the response, then attempt a self-serve privilege escalation:

```bash
curl -s -X PATCH http://localhost:3000/api/customers/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <token>" \
  -d '{"segment":"vip"}'
```

Expected: HTTP 200 (document-level update is allowed — the customer can update their own profile), but the returned `doc.segment` is still `"new"`, not `"vip"` — proving the field-level access lock silently drops the disallowed field write rather than erroring the whole request.

- [ ] **Step 4: Clean up test data**

Log in as admin (`admin@novatech.demo` / `admin123456`) via `/api/users/login`, capture that token, then delete the test customer:

```bash
curl -s -X DELETE http://localhost:3000/api/customers/<id> \
  -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 5: Commit**

```bash
git add collections/Customers.ts
git commit -m "feat(crm): add segment/segmentOverride fields with field-level write lock"
```

---

## Task 2: CustomerNotes collection (staff-only)

**Files:**
- Create: `collections/CustomerNotes.ts`
- Modify: `payload.config.ts:10-19` (imports), `payload.config.ts:29` (collections array)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: collection slug `"customer-notes"` with fields `customer` (relationship → `customers`, required), `type` (select, default `"note"`), `content` (textarea, required), `author` (relationship → `users`, admin `readOnly: true`, auto-filled from `req.user.id`). Later tasks (`lib/crm.ts` timeline, `app/api/crm/note`) create/read documents in this collection by these exact field names.

- [ ] **Step 1: Create `collections/CustomerNotes.ts`**

```ts
import type { CollectionConfig } from "payload";

// Ghi chú/hoạt động sales gắn với 1 khách hàng (Giai đoạn 3 - CRM). Hoàn toàn
// nội bộ: khách hàng không bao giờ được đọc hay ghi nhóm dữ liệu này, vì đây
// là ghi chú NỘI BỘ về khách (vd "đã gọi, khách còn đang cân nhắc giá").
export const CustomerNotes: CollectionConfig = {
  slug: "customer-notes",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["customer", "type", "author", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => user?.collection === "users",
    create: ({ req: { user } }) => user?.collection === "users",
    update: ({ req: { user } }) => user?.collection === "users",
    delete: ({ req: { user } }) => user?.collection === "users",
  },
  fields: [
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "type",
      type: "select",
      defaultValue: "note",
      options: [
        { label: "Ghi chú", value: "note" },
        { label: "Gọi điện", value: "call" },
        { label: "Gặp mặt", value: "meeting" },
        { label: "Email", value: "email" },
        { label: "Khác", value: "other" },
      ],
    },
    {
      name: "content",
      type: "textarea",
      required: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
      hooks: {
        beforeChange: [({ req, value }) => value ?? req.user?.id],
      },
    },
  ],
};
```

- [ ] **Step 2: Register the collection in `payload.config.ts`**

Add the import next to the other collection imports (after line 19, `import { Orders } from "./collections/Orders";`):

```ts
import { CustomerNotes } from "./collections/CustomerNotes";
```

Add `CustomerNotes` to the `collections` array (line 29):

```ts
  collections: [Users, Customers, Media, Services, Products, News, Team, Clients, Stats, Leads, Orders, CustomerNotes],
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Restart the dev server and verify access control**

Restart the dev server (new collection registered — Payload must re-init).

As admin, create a note:

```bash
curl -s -X POST http://localhost:3000/api/customer-notes \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <admin-token>" \
  -d '{"customer":"<any-existing-customer-id>","type":"note","content":"Test note"}'
```

Expected: HTTP 201, `doc.author` equals the admin user's id (auto-filled, was not sent in the body).

As a logged-in customer (any existing test customer token), attempt to read:

```bash
curl -s http://localhost:3000/api/customer-notes -H "Authorization: JWT <customer-token>"
```

Expected: empty `docs: []` (access control filters out everything — Payload returns 200 with no docs for a denied `read` returning `false`, not a 403, since `read` access can also be a query constraint; a boolean `false` results in no matching documents).

- [ ] **Step 5: Clean up test data**

Delete the test note created in Step 4 via `DELETE /api/customer-notes/<id>` with the admin token.

- [ ] **Step 6: Commit**

```bash
git add collections/CustomerNotes.ts payload.config.ts
git commit -m "feat(crm): add staff-only CustomerNotes collection"
```

---

## Task 3: Segment auto-calculation — `lib/crm.ts` + Orders hooks

**Files:**
- Create: `lib/crm.ts`
- Modify: `collections/Orders.ts:5-21` (add `hooks` key to the collection config)

**Interfaces:**
- Consumes: `Customers.segment`/`segmentOverride` (Task 1), `Orders.paymentStatus`/`total`/`customer` (existing fields).
- Produces: `computeSegmentForOrders(paidTotal: number, paidCount: number): "new" | "potential" | "vip"` and `recomputeSegment(payload: Payload, customerId: string | number): Promise<void>` from `lib/crm.ts` — task 4 (timeline) and task 5 (route handlers) import both.

- [ ] **Step 1: Create `lib/crm.ts` with the segment logic**

```ts
import "server-only";
import type { Payload } from "payload";

export type CustomerSegment = "new" | "potential" | "vip";

const VIP_MIN_TOTAL = 5_000_000;
const VIP_MIN_ORDER_COUNT = 3;

export function computeSegmentForOrders(paidTotal: number, paidCount: number): CustomerSegment {
  if (paidCount === 0) return "new";
  if (paidTotal >= VIP_MIN_TOTAL || paidCount >= VIP_MIN_ORDER_COUNT) return "vip";
  return "potential";
}

/**
 * Tính lại và lưu segment cho 1 khách hàng dựa trên các đơn đã thanh toán.
 * Bỏ qua nếu segmentOverride === true (admin đã ghi đè tay).
 */
export async function recomputeSegment(payload: Payload, customerId: string | number): Promise<void> {
  const customer = await payload.findByID({ collection: "customers", id: customerId });
  if (!customer || customer.segmentOverride) return;

  const paidOrders = await payload.find({
    collection: "orders",
    where: {
      customer: { equals: customerId },
      paymentStatus: { equals: "paid" },
    },
    limit: 0,
  });

  const paidTotal = paidOrders.docs.reduce((sum, order) => sum + (order.total || 0), 0);
  const nextSegment = computeSegmentForOrders(paidTotal, paidOrders.docs.length);

  if (customer.segment !== nextSegment) {
    await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment: nextSegment },
    });
  }
}
```

- [ ] **Step 2: Wire the recompute into `Orders` lifecycle hooks**

In `collections/Orders.ts`, add the import at the top (after line 1):

```ts
import type { CollectionConfig } from "payload";
import { recomputeSegment } from "../lib/crm";
```

Add a `hooks` key to the collection config, right after the `access` block (after line 21, before `fields: [`):

```ts
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return true; // admin xem tất cả đơn
      return { customer: { equals: user.id } }; // khách chỉ xem đơn của mình
    },
    create: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Không để lỗi tính segment làm hỏng việc lưu đơn hàng — đơn hàng
        // quan trọng hơn nhãn CRM, nên bọc try/catch và chỉ log khi lỗi.
        try {
          await recomputeSegment(req.payload, doc.customer);
        } catch (err) {
          console.error("[crm] recompute segment (afterChange) lỗi:", err);
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          await recomputeSegment(req.payload, doc.customer);
        } catch (err) {
          console.error("[crm] recompute segment (afterDelete) lỗi:", err);
        }
      },
    ],
  },
  fields: [
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Restart the dev server and verify auto-segmentation end-to-end**

Restart the dev server (new collection hook — must re-init).

Register a fresh test customer + log in (same pattern as Task 1 Step 3) to get `<id2>` and `<token2>`, targeting `crmtest2@example.com`.

Check initial segment (should be `"new"` with 0 orders):

```bash
curl -s http://localhost:3000/api/customers/<id2> -H "Authorization: JWT <admin-token>"
```

As admin, create a paid order for 2,000,000đ directly:

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <admin-token>" \
  -d '{
    "customer":"<id2>",
    "orderNumber":"CRMTEST-001",
    "customerName":"CRM Test 2",
    "customerEmail":"crmtest2@example.com",
    "customerPhone":"0900000000",
    "shippingAddress":"Test",
    "items":[{"productId":"p1","productName":"Test Product","quantity":1,"price":2000000}],
    "subtotal":2000000,
    "total":2000000,
    "paymentStatus":"paid"
  }'
```

Re-check the customer:

```bash
curl -s http://localhost:3000/api/customers/<id2> -H "Authorization: JWT <admin-token>"
```

Expected: `segment === "potential"` (2,000,000 < 5,000,000 and 1 order < 3).

Create a second paid order for 4,000,000đ (same shape, `orderNumber: "CRMTEST-002"`, `total: 4000000`). Re-check the customer.

Expected: `segment === "vip"` (total now 6,000,000 ≥ 5,000,000).

Delete both test orders (`DELETE /api/orders/<orderId>` with admin token) and re-check the customer.

Expected: `segment === "new"` again (0 paid orders remain — proves `afterDelete` also recomputes).

- [ ] **Step 5: Clean up remaining test data**

Delete the test customer `<id2>` via admin token (orders already deleted in Step 4, so no FK violation).

- [ ] **Step 6: Commit**

```bash
git add lib/crm.ts collections/Orders.ts
git commit -m "feat(crm): auto-recompute customer segment from paid orders"
```

---

## Task 4: 360° timeline — `getCustomerTimeline`

**Files:**
- Modify: `lib/crm.ts` (append to the file created in Task 3)

**Interfaces:**
- Consumes: `Orders` (customer, orderNumber, total, paymentStatus, createdAt), `CustomerNotes` (Task 2: customer, type, content, author, createdAt), `Leads` (email, subject, status, createdAt — existing collection, no schema change).
- Produces: `export type TimelineEvent` and `getCustomerTimeline(payload: Payload, customerId: string | number): Promise<TimelineEvent[]>` — Task 7 (`CrmDetailView`) imports and renders this directly.

- [ ] **Step 1: Append the timeline type and function to `lib/crm.ts`**

```ts
export type TimelineEvent = {
  kind: "lead" | "order" | "note";
  date: string;
  title: string;
  detail?: string;
  status?: string;
  href?: string;
};

/**
 * Gộp lead (liên kết mềm theo email) + đơn hàng + ghi chú sales của 1 khách
 * thành một dòng thời gian, sắp xếp mới nhất trước.
 */
export async function getCustomerTimeline(payload: Payload, customerId: string | number): Promise<TimelineEvent[]> {
  const customer = await payload.findByID({ collection: "customers", id: customerId });

  const [orders, notes, leads] = await Promise.all([
    payload.find({
      collection: "orders",
      where: { customer: { equals: customerId } },
      limit: 0,
    }),
    payload.find({
      collection: "customer-notes",
      where: { customer: { equals: customerId } },
      limit: 0,
      depth: 1,
    }),
    customer?.email
      ? payload.find({
          collection: "leads",
          where: { email: { equals: customer.email } },
          limit: 0,
        })
      : Promise.resolve({ docs: [] as any[] }),
  ]);

  const events: TimelineEvent[] = [];

  for (const order of orders.docs) {
    events.push({
      kind: "order",
      date: order.createdAt,
      title: `Đơn ${order.orderNumber} — ${(order.total || 0).toLocaleString("vi-VN")}đ`,
      status: order.paymentStatus,
      href: `/admin/collections/orders/${order.id}`,
    });
  }

  for (const note of notes.docs) {
    const author =
      note.author && typeof note.author === "object"
        ? note.author.name || note.author.email
        : "";
    events.push({
      kind: "note",
      date: note.createdAt,
      title: `Ghi chú (${note.type})${author ? ` — ${author}` : ""}`,
      detail: note.content,
    });
  }

  for (const lead of leads.docs) {
    events.push({
      kind: "lead",
      date: lead.createdAt,
      title: `Lead: ${lead.subject}`,
      status: lead.status,
      href: `/admin/collections/leads/${lead.id}`,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify with a temporary debug route**

There is no test runner, and `getCustomerTimeline` isn't wired to any UI yet (that's Task 7). Verify it directly by temporarily adding a throwaway debug route:

Create `app/api/crm/_debug-timeline/route.ts`:

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { getCustomerTimeline } from "@/lib/crm";

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user || user.collection !== "users") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("customerId");
  if (!id) return Response.json({ error: "missing customerId" }, { status: 400 });
  const timeline = await getCustomerTimeline(payload, id);
  return Response.json({ timeline });
}
```

Restart the dev server. Create a test customer (`crmtest3@example.com`), a paid order for them, a customer-note for them, and a lead with the same email (`POST /api/leads` with `{"name":"CRM Test 3","email":"crmtest3@example.com","phone":"0900000000","subject":"Test lead","message":"test"}`).

```bash
curl -s "http://localhost:3000/api/crm/_debug-timeline?customerId=<id3>" -H "Authorization: JWT <admin-token>"
```

Expected: `timeline` array with 3 entries, `kind` values `"order"`, `"note"`, `"lead"` all present, sorted by `date` descending.

- [ ] **Step 4: Remove the debug route and clean up test data**

Delete `app/api/crm/_debug-timeline/route.ts` entirely (it was only for manually exercising `getCustomerTimeline` before the real UI exists in Task 7).

Delete the test order, note, lead, and customer created in Step 3 via admin token.

- [ ] **Step 5: Typecheck again (debug route removed)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/crm.ts
git commit -m "feat(crm): add 360-degree customer timeline (orders + notes + leads)"
```

---

## Task 5: Staff-only CRM route handlers

**Files:**
- Create: `app/api/crm/segment/route.ts`
- Create: `app/api/crm/segment/auto/route.ts`
- Create: `app/api/crm/note/route.ts`

**Interfaces:**
- Consumes: `recomputeSegment` (Task 3), `CustomerSegment` type (Task 3), `customer-notes` collection (Task 2).
- Produces: three POST endpoints Task 7's `CrmDetailView` forms submit to.

- [ ] **Step 1: Create `app/api/crm/segment/route.ts` (manual override)**

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import type { CustomerSegment } from "@/lib/crm";

const VALID_SEGMENTS: CustomerSegment[] = ["new", "potential", "vip"];

// Ghi đè nhóm khách hàng thủ công. Chỉ tài khoản nội bộ (users) được gọi —
// segmentOverride:true nên khi bật, Orders hook (lib/crm.ts) sẽ không tự
// tính lại nhóm này nữa cho tới khi gọi /api/crm/segment/auto.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const customerId = body.customerId;
    const segment = body.segment;

    if (!customerId || !VALID_SEGMENTS.includes(segment)) {
      return Response.json({ message: "Thiếu customerId hoặc segment không hợp lệ" }, { status: 400 });
    }

    const doc = await payload.update({
      collection: "customers",
      id: customerId,
      data: { segment, segmentOverride: true },
    });

    return Response.json({ message: "Đã cập nhật nhóm khách hàng", doc });
  } catch (error: any) {
    console.error("[crm] set segment error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/crm/segment/auto/route.ts` (revert to automatic)**

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { recomputeSegment } from "@/lib/crm";

// Bỏ ghi đè thủ công và tính lại nhóm theo doanh số hiện tại.
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user || user.collection !== "users") {
      return Response.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const customerId = body.customerId;
    if (!customerId) {
      return Response.json({ message: "Thiếu customerId" }, { status: 400 });
    }

    await payload.update({
      collection: "customers",
      id: customerId,
      data: { segmentOverride: false },
    });
    await recomputeSegment(payload, customerId);

    const doc = await payload.findByID({ collection: "customers", id: customerId });
    return Response.json({ message: "Đã quay lại tự động phân nhóm", doc });
  } catch (error: any) {
    console.error("[crm] auto segment error:", error);
    return Response.json({ message: "Có lỗi xảy ra" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `app/api/crm/note/route.ts`**

```ts
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
    const customerId = body.customerId;
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
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Restart the dev server and verify all three routes**

Create a fresh test customer `crmtest4@example.com` → `<id4>` (admin token for all calls below).

Set manual VIP override:

```bash
curl -s -X POST http://localhost:3000/api/crm/segment \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"customerId":"<id4>","segment":"vip"}'
```
Expected: `doc.segment === "vip"`, `doc.segmentOverride === true`.

Add a note:

```bash
curl -s -X POST http://localhost:3000/api/crm/note \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"customerId":"<id4>","type":"call","content":"Đã gọi, khách hài lòng"}'
```
Expected: HTTP 200, `doc.author` equals admin user id.

Revert to automatic:

```bash
curl -s -X POST http://localhost:3000/api/crm/segment/auto \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"customerId":"<id4>"}'
```
Expected: `doc.segmentOverride === false`, `doc.segment === "new"` (0 paid orders).

Verify a non-`users` caller is rejected — log in as any customer, then:

```bash
curl -s -X POST http://localhost:3000/api/crm/segment \
  -H "Content-Type: application/json" -H "Authorization: JWT <customer-token>" \
  -d '{"customerId":"<id4>","segment":"vip"}'
```
Expected: HTTP 403.

- [ ] **Step 6: Clean up test data**

Delete the note created in Step 5 (`DELETE /api/customer-notes/<id>`) and the test customer `<id4>`.

- [ ] **Step 7: Commit**

```bash
git add app/api/crm
git commit -m "feat(crm): add staff-only segment override and note routes"
```

---

## Task 6: Custom admin view — CRM list

**Files:**
- Create: `components/admin/CrmNav.tsx`
- Create: `components/admin/CrmListView.tsx`
- Modify: `payload.config.ts:24-28` (admin.components block)

**Interfaces:**
- Consumes: `Customers` (segment, name, email, phone), `Orders` (customer, total, paymentStatus) — aggregated in JS to avoid N+1 queries, per spec.
- Produces: `/admin/crm` page; links to `/admin/crm/:id` (built in Task 7).

- [ ] **Step 1: Create `components/admin/CrmNav.tsx`**

```tsx
// Link "CRM" trong sidebar /admin. Không cần tự kiểm tra quyền ở đây — toàn
// bộ khung /admin (admin.user = Users.slug trong payload.config.ts) đã chỉ
// cho tài khoản "users" đăng nhập được vào, khách hàng (customers) không thể
// vào /admin dù có cookie hợp lệ.
export function CrmNav() {
  return (
    <a
      href="/admin/crm"
      style={{
        display: "block",
        padding: "8px 16px",
        fontWeight: 600,
      }}
    >
      CRM
    </a>
  );
}
```

- [ ] **Step 2: Create `components/admin/CrmListView.tsx`**

```tsx
import type { AdminViewServerProps } from "payload";

const SEGMENT_LABELS: Record<string, string> = {
  new: "Mới",
  potential: "Tiềm năng",
  vip: "VIP",
};

export async function CrmListView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;

  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  const segmentFilter = typeof searchParams?.segment === "string" ? searchParams.segment : undefined;

  const [customers, paidOrders] = await Promise.all([
    req.payload.find({
      collection: "customers",
      where: segmentFilter ? { segment: { equals: segmentFilter } } : undefined,
      limit: 200,
    }),
    // Đọc toàn bộ đơn đã thanh toán 1 lần rồi gộp theo customer trong JS,
    // tránh N+1 query (1 query / khách) khi danh sách khách hàng dài.
    // depth: 0 để order.customer là id thô (không populate thành object) —
    // nếu không, String(order.customer) === "[object Object]" và không khớp
    // được với String(customer.id) khi gộp theo khách.
    req.payload.find({
      collection: "orders",
      where: { paymentStatus: { equals: "paid" } },
      limit: 0,
      depth: 0,
    }),
  ]);

  const statsByCustomer = new Map<string, { total: number; count: number }>();
  for (const order of paidOrders.docs) {
    const key = String(order.customer);
    const prev = statsByCustomer.get(key) || { total: 0, count: 0 };
    statsByCustomer.set(key, { total: prev.total + (order.total || 0), count: prev.count + 1 });
  }

  const rows = customers.docs
    .map((customer) => {
      const stats = statsByCustomer.get(String(customer.id)) || { total: 0, count: 0 };
      return { customer, ...stats };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 24 }}>
      <h1>CRM — Khách hàng</h1>
      <div style={{ margin: "12px 0" }}>
        <a href="/admin/crm">Tất cả</a>
        {" · "}
        <a href="/admin/crm?segment=new">Mới</a>
        {" · "}
        <a href="/admin/crm?segment=potential">Tiềm năng</a>
        {" · "}
        <a href="/admin/crm?segment=vip">VIP</a>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Tên</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "left" }}>SĐT</th>
            <th style={{ textAlign: "left" }}>Nhóm</th>
            <th style={{ textAlign: "right" }}>Tổng chi tiêu</th>
            <th style={{ textAlign: "right" }}>Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ customer, total, count }) => (
            <tr key={customer.id}>
              <td>
                <a href={`/admin/crm/${customer.id}`}>{customer.name}</a>
              </td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{SEGMENT_LABELS[customer.segment as string] || customer.segment}</td>
              <td style={{ textAlign: "right" }}>{total.toLocaleString("vi-VN")}đ</td>
              <td style={{ textAlign: "right" }}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Register the view and nav link in `payload.config.ts`**

Add an `admin.components` block to the existing `admin` key (currently lines 25-28):

```ts
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      views: {
        crmList: {
          Component: "/components/admin/CrmListView#CrmListView",
          path: "/crm",
          exact: true,
        },
      },
      beforeNavLinks: ["/components/admin/CrmNav#CrmNav"],
    },
  },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Regenerate the import map and restart the dev server**

Run: `npx payload generate:importmap`
Expected: `app/(payload)/admin/importMap.js` is rewritten to include an entry mapping `/components/admin/CrmListView#CrmListView` and `/components/admin/CrmNav#CrmNav` to their actual imports.

Restart the dev server.

- [ ] **Step 6: Verify in the browser**

Open `http://localhost:3000/admin`, log in as `admin@novatech.demo` / `admin123456`. Confirm:
- A "CRM" link appears in the sidebar (from `beforeNavLinks`).
- Clicking it navigates to `/admin/crm` and renders a table of customers with segment/spend/order-count columns.
- The segment filter links (`?segment=vip` etc.) narrow the table correctly.

- [ ] **Step 7: Commit**

```bash
git add components/admin/CrmNav.tsx components/admin/CrmListView.tsx payload.config.ts
git commit -m "feat(crm): add CRM list custom admin view + nav link"
```

---

## Task 7: Custom admin view — CRM detail (timeline + override + notes)

**Files:**
- Create: `components/admin/CrmDetailView.tsx`
- Modify: `payload.config.ts` (add `crmDetail` entry to `admin.components.views`, from Task 6 Step 3)

**Interfaces:**
- Consumes: `getCustomerTimeline` (Task 4), `app/api/crm/segment`, `app/api/crm/segment/auto`, `app/api/crm/note` (Task 5).
- Produces: `/admin/crm/:id` page, linked from Task 6's list rows.

- [ ] **Step 1: Create `components/admin/CrmDetailView.tsx`**

```tsx
import type { AdminViewServerProps } from "payload";
import { getCustomerTimeline } from "@/lib/crm";

const SEGMENT_LABELS: Record<string, string> = {
  new: "Mới",
  potential: "Tiềm năng",
  vip: "VIP",
};

const KIND_LABELS: Record<string, string> = {
  order: "Đơn hàng",
  note: "Ghi chú",
  lead: "Lead",
};

export async function CrmDetailView({ initPageResult, params }: AdminViewServerProps) {
  const { req } = initPageResult;

  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  const id = params?.id as string;
  const customer = await req.payload.findByID({ collection: "customers", id });
  const timeline = await getCustomerTimeline(req.payload, id);

  return (
    <div style={{ padding: 24 }}>
      <p>
        <a href="/admin/crm">← Danh sách khách hàng</a>
      </p>
      <h1>{customer.name}</h1>
      <p>
        {customer.email} · {customer.phone}
      </p>
      <p>
        Nhóm hiện tại: <strong>{SEGMENT_LABELS[customer.segment as string] || customer.segment}</strong>
        {customer.segmentOverride ? " (đã ghi đè thủ công)" : ""}
      </p>

      <section style={{ margin: "16px 0" }}>
        <h2>Ghi đè nhóm</h2>
        <form action="/api/crm/segment" method="post" data-crm-form="segment">
          <input type="hidden" name="customerId" value={String(customer.id)} />
          <select name="segment" defaultValue={customer.segment as string}>
            <option value="new">Mới</option>
            <option value="potential">Tiềm năng</option>
            <option value="vip">VIP</option>
          </select>
          <button type="submit">Đặt nhóm thủ công</button>
        </form>
        {customer.segmentOverride ? (
          <form action="/api/crm/segment/auto" method="post" data-crm-form="segment-auto">
            <input type="hidden" name="customerId" value={String(customer.id)} />
            <button type="submit">Quay lại tự động</button>
          </form>
        ) : null}
      </section>

      <section style={{ margin: "16px 0" }}>
        <h2>Thêm ghi chú</h2>
        <form action="/api/crm/note" method="post" data-crm-form="note">
          <input type="hidden" name="customerId" value={String(customer.id)} />
          <select name="type" defaultValue="note">
            <option value="note">Ghi chú</option>
            <option value="call">Gọi điện</option>
            <option value="meeting">Gặp mặt</option>
            <option value="email">Email</option>
            <option value="other">Khác</option>
          </select>
          <textarea name="content" required rows={3} style={{ display: "block", width: "100%" }} />
          <button type="submit">Lưu ghi chú</button>
        </form>
      </section>

      <section>
        <h2>Dòng thời gian</h2>
        <ul>
          {timeline.map((event, index) => (
            <li key={index}>
              <strong>{KIND_LABELS[event.kind]}</strong> — {new Date(event.date).toLocaleString("vi-VN")}
              <br />
              {event.href ? <a href={event.href}>{event.title}</a> : event.title}
              {event.status ? ` (${event.status})` : ""}
              {event.detail ? <div>{event.detail}</div> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

*(Note: the forms use plain HTML `<form action=... method="post">` posting directly to the route handlers, since this is a Server Component with no client-side JS bundle by default. This means the browser navigates to the JSON response after submit — acceptable for this internal staff tool per the spec's YAGNI stance on UI polish; do not add client-side fetch/interactivity here as that would require converting this into a Client Component, which is out of scope for this plan.)*

- [ ] **Step 2: Register the `crmDetail` view in `payload.config.ts`**

Extend the `views` object added in Task 6 Step 3:

```ts
      views: {
        crmList: {
          Component: "/components/admin/CrmListView#CrmListView",
          path: "/crm",
          exact: true,
        },
        crmDetail: {
          Component: "/components/admin/CrmDetailView#CrmDetailView",
          path: "/crm/:id",
          exact: true,
        },
      },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Regenerate import map and restart the dev server**

Run: `npx payload generate:importmap`
Restart the dev server.

- [ ] **Step 5: Verify in the browser end-to-end**

Create a temporary test customer via `/api/customers` (e.g. `crmtest5@example.com`) and one paid order for them (same pattern as Task 3 Step 4, `total: 1000000`), so the timeline has at least one order event.

In the browser, go to `/admin/crm`, click through to that customer's row → confirm `/admin/crm/<id>` renders: customer info, current segment, the order event in the timeline.

Submit the "Ghi đè nhóm" form choosing "VIP" → confirm the page (or JSON response) reflects the update; reload `/admin/crm/<id>` and confirm segment now shows VIP with "(đã ghi đè thủ công)", and a "Quay lại tự động" button now appears.

Submit "Quay lại tự động" → reload → confirm segment recalculates to "potential" (1,000,000 < 5,000,000, 1 order < 3) and the override note disappears.

Submit a note via the "Thêm ghi chú" form → reload `/admin/crm/<id>` → confirm it appears in the timeline under "Ghi chú".

- [ ] **Step 6: Clean up test data**

Delete the test note, the test order, and the test customer created in Step 5 via admin REST calls.

- [ ] **Step 7: Final regression check**

Run: `npx tsc --noEmit` (expect clean).

In the browser, confirm the pre-existing admin collections still load normally: `/admin/collections/customers`, `/admin/collections/orders`, `/admin/collections/leads`, `/admin/collections/customer-notes` all open without errors.

- [ ] **Step 8: Commit**

```bash
git add components/admin/CrmDetailView.tsx payload.config.ts
git commit -m "feat(crm): add CRM detail view with segment override and note form"
```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to a task — data model (Task 1, 2), segment logic (Task 3), timeline (Task 4), routes (Task 5), UI (Task 6, 7). Security section is covered by the field-level access lock (Task 1, verified via REST+JWT, not Local API, since Local API defaults `overrideAccess: true` and would not exercise the guard), `customer-notes` staff-only access (Task 2), and every `/api/crm/*` route re-checking `user.collection === "users"` (Task 5).
- **Type consistency:** `CustomerSegment` and `TimelineEvent` are defined once in `lib/crm.ts` (Task 3/4) and only ever imported, never redefined, in Task 5 and Task 7.
- **No placeholders:** every step has literal, complete code. The one temporary artifact (`app/api/crm/_debug-timeline/route.ts` in Task 4) is explicitly created and then explicitly deleted within the same task, not left dangling.
