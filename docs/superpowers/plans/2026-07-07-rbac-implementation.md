# RBAC (Giai đoạn 3 — Phần 2D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the existing `Users.roles` field (admin/editor/sales/accountant) across CRM, Dashboard, Orders/Customers, and 7 content collections that currently default to Payload's `Boolean(user)` access — and close a self-escalation gap where `Users.ts` has no access config at all.

**Architecture:** One new pure helper `lib/rbac.ts` exporting `hasRole(user, allowed)`, called directly at every access function / custom view / route / nav component that needs a role check — no new collection, no permission-management UI (only 4 fixed roles).

**Tech Stack:** Next.js 15 (App Router) + Payload CMS 3.85.1 (Local API) + Postgres (Neon). No dedicated test runner exists in this repo (see Global Constraints).

**Spec:** [docs/superpowers/specs/2026-07-07-rbac-design.md](../specs/2026-07-07-rbac-design.md)

## Global Constraints

- No automated test framework (no jest/vitest/pytest) is installed in this repo — verification uses **`npx tsc --noEmit`** (must be clean after every task) plus **manual curl checks against the running dev server**, mirroring how CRM and Dashboard were verified.
- Restart the dev server after every task in this plan — every task modifies a collection's `access` (or a component/route that a collection's admin view depends on), and Payload's collection config is compiled once per process at `getPayload()` init. A plain Fast Refresh does not pick up `access` function changes reliably.
- This repo has no generated `payload-types.ts` — Local API results and `req.user` are loosely typed (same as existing code). Do not import or generate one; access fields directly as the existing `lib/crm.ts`/`lib/dashboard.ts` do.
- **Empirically confirmed fact, use it for every "should be denied" assertion in this plan:** a Payload collection's `read` access function returning boolean `false` causes the REST list/get endpoint to respond **`HTTP 403`** with body `{"errors":[{"message":"You are not allowed to perform this action."}]}` — **not** an empty `docs: []`. (Verified live against this exact codebase's `customer-notes` endpoint during planning.)
- **`hasRole(user, [])` idiom = "admin only."** Passing an empty `allowed` array means only a user whose `roles` contains `"admin"` passes (the non-admin branch, `allowed.some(...)` on `[]`, is always `false`). This exact idiom is used everywhere in this plan instead of a separate `isAdmin()` helper — every task's code re-explains this the first time it appears, but it is one function, defined once in Task 1.
- Only **one** real `users` account exists in the current database (`admin@novatech.demo`, `roles: ["admin"]`) — there is no risk of locking out an active non-admin staff member; all other role accounts created during this plan's verification are throwaway test accounts you create and delete yourself.
- Admin login for manual verification: `admin@novatech.demo` / `admin123456`.
- Clean up all test users/customers/products/etc. created during manual verification (delete via REST as the `users` admin) before marking a task done.
- Dev server: assume `npm run dev` is already running; check with a quick curl to `http://localhost:3000/admin` before starting a new one if unsure.

---

## File Structure

```
lib/rbac.ts                     CREATE  Role type, hasRole(user, allowed): boolean

collections/Users.ts             MODIFY  access (create/update/delete: admin only; read: any staff);
                                          field-level lock on `roles`
collections/Products.ts          MODIFY  add create/update/delete: hasRole(user, [])
collections/Services.ts          MODIFY  add create/update/delete to the `publicRead` const
collections/News.ts              MODIFY  add create/update/delete: hasRole(user, [])
collections/Team.ts              MODIFY  add create/update/delete: hasRole(user, [])
collections/Clients.ts           MODIFY  add create/update/delete: hasRole(user, [])
collections/Stats.ts             MODIFY  add create/update/delete: hasRole(user, [])
collections/Media.ts             MODIFY  add create/update/delete: hasRole(user, [])
collections/Leads.ts             MODIFY  read: hasRole(user, ["admin","sales"])
collections/CustomerNotes.ts     MODIFY  all 4 ops: hasRole(user, ["admin","sales"])
collections/Customers.ts         MODIFY  internal branch of read/update/delete: hasRole(user, ["admin","sales","accountant"]);
                                          segment/segmentOverride field access: hasRole(user, ["admin","sales"])
collections/Orders.ts            MODIFY  internal branch of read + new delete: hasRole(user, ["admin","sales","accountant"])

components/admin/CrmNav.tsx         MODIFY  hide unless hasRole(user, ["admin","sales"])
components/admin/CrmListView.tsx    MODIFY  guard: hasRole(req.user, ["admin","sales"])
components/admin/CrmDetailView.tsx  MODIFY  guard: hasRole(req.user, ["admin","sales"])
app/api/crm/segment/route.ts        MODIFY  guard: hasRole(user, ["admin","sales"])
app/api/crm/segment/auto/route.ts   MODIFY  guard: hasRole(user, ["admin","sales"])
app/api/crm/note/route.ts           MODIFY  guard: hasRole(user, ["admin","sales"])

components/admin/DashboardView.tsx  MODIFY  guard: hasRole(req.user, ["admin","sales","accountant"])
components/admin/DashboardNav.tsx   MODIFY  hide unless hasRole(user, ["admin","sales","accountant"])
```

---

## Task 1: `lib/rbac.ts` — the `hasRole()` helper

**Files:**
- Create: `lib/rbac.ts`
- Test: temporary debug route `app/api/rbac/_debug-hasrole/route.ts` (created and removed within this task)

**Interfaces:**
- Produces: `export type Role = "admin" | "editor" | "sales" | "accountant"` and `export function hasRole(user, allowed: Role[]): boolean` — every later task imports this by these exact names. `user` accepts anything with optional `collection`/`roles` fields (matches Payload's loosely-typed `req.user` in this repo, which has no generated `payload-types.ts`).

- [ ] **Step 1: Create `lib/rbac.ts`**

```ts
import "server-only";

export type Role = "admin" | "editor" | "sales" | "accountant";

type RoleCheckableUser = { collection?: string; roles?: Role[] | null } | null | undefined;

/**
 * true nếu user là tài khoản nội bộ (collection "users") VÀ có role "admin"
 * (luôn bypass mọi kiểm tra) HOẶC có ít nhất 1 role nằm trong `allowed`.
 *
 * hasRole(user, []) chỉ true khi roles chứa "admin" — dùng làm idiom "chỉ
 * admin" xuyên suốt codebase thay vì viết riêng isAdmin(). KHÔNG dùng hàm
 * này để kiểm tra "là nhân viên nội bộ nói chung bất kể role" — dùng thẳng
 * `user?.collection === "users"` cho trường hợp đó (hasRole(user, []) luôn
 * false cho non-admin dù roles của họ là gì).
 */
export function hasRole(user: RoleCheckableUser, allowed: Role[]): boolean {
  if (!user || user.collection !== "users") return false;
  const roles = user.roles || [];
  if (roles.includes("admin")) return true;
  return allowed.some((r) => roles.includes(r));
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Create a temporary debug route to exercise `hasRole` with synthetic inputs**

`hasRole` is a pure function with no DB/auth dependency — verify it directly with hardcoded fake user objects, no real login needed. Create `app/api/rbac/_debug-hasrole/route.ts`:

```ts
import { hasRole } from "@/lib/rbac";

export async function GET() {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, actual: boolean, expected: boolean) => {
    results.push({ name, pass: actual === expected });
  };

  check("admin bypasses empty allowed", hasRole({ collection: "users", roles: ["admin"] }, []), true);
  check("admin bypasses unrelated allowed", hasRole({ collection: "users", roles: ["admin"] }, ["sales"]), true);
  check("sales in allowed list", hasRole({ collection: "users", roles: ["sales"] }, ["admin", "sales"]), true);
  check("editor NOT in allowed list", hasRole({ collection: "users", roles: ["editor"] }, ["admin", "sales"]), false);
  check(
    "customers-collection account rejected even with matching roles array",
    hasRole({ collection: "customers", roles: ["admin"] as any }, ["admin"]),
    false
  );
  check("no user rejected", hasRole(undefined, ["admin"]), false);
  check("staff user with no roles rejected", hasRole({ collection: "users" }, ["sales"]), false);
  check("empty allowed rejects non-admin (admin-only idiom)", hasRole({ collection: "users", roles: ["sales"] }, []), false);

  const allPass = results.every((r) => r.pass);
  return Response.json({ allPass, results });
}
```

- [ ] **Step 4: Restart the dev server and run the check**

```bash
curl -s http://localhost:3000/api/rbac/_debug-hasrole
```

Expected: JSON with `"allPass": true` and every entry in `results` showing `"pass": true`.

- [ ] **Step 5: Remove the debug route**

Delete `app/api/rbac/_debug-hasrole/route.ts` entirely (it was only for manually exercising `hasRole` before real access-control call sites exist, starting Task 2).

- [ ] **Step 6: Typecheck again (debug route removed)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/rbac.ts
git commit -m "feat(rbac): add hasRole() helper for role-based access checks"
```

---

## Task 2: `collections/Users.ts` — close the self-escalation gap

**Files:**
- Modify: `collections/Users.ts`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: `Users` collection now requires `hasRole(user, [])` (admin-only) for `create`/`update`/`delete`, and any staff (`user?.collection === "users"`) for `read`. The `roles` field additionally locks `create`/`update` to admin-only at the field level.

`Users.ts` currently defines **no `access` block at all**, so Payload's default `Boolean(user)` applies to every operation — meaning any authenticated account (including a `customers`-collection account) can currently create new staff accounts via `POST /api/users`, and any staff account (regardless of role) can `PATCH` its own `roles` to `["admin"]`. This task closes both holes.

- [ ] **Step 1: Add `access` and lock the `roles` field in `collections/Users.ts`**

Current file:

```ts
import type { CollectionConfig } from "payload";

// Tài khoản quản trị (admin/biên tập viên...). Auth tích hợp sẵn của Payload.
// Giai đoạn 3 sẽ mở rộng phân quyền (admin, sales, kế toán) qua field `roles`.
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Biên tập viên", value: "editor" },
        { label: "Sales", value: "sales" },
        { label: "Kế toán", value: "accountant" },
      ],
    },
  ],
};
```

Replace it entirely with:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Tài khoản quản trị (admin/biên tập viên...). Auth tích hợp sẵn của Payload.
// Giai đoạn 3 mở rộng phân quyền (admin, sales, kế toán) qua field `roles`,
// thực thi bằng hasRole() (lib/rbac.ts).
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    // Mọi nhân viên nội bộ đều xem được danh sách nhân viên khác (vd để
    // chọn "author" cho ghi chú CRM) — không cần role cụ thể.
    read: ({ req: { user } }) => user?.collection === "users",
    // Chỉ admin được tạo/sửa/xoá tài khoản nhân sự. Trước đây không có
    // access nào ở đây nên Payload mặc định Boolean(user) — bất kỳ ai đăng
    // nhập (kể cả khách hàng) tự tạo được tài khoản nhân sự, và bất kỳ nhân
    // viên role thấp nào cũng tự PATCH roles của mình thành admin.
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Biên tập viên", value: "editor" },
        { label: "Sales", value: "sales" },
        { label: "Kế toán", value: "accountant" },
      ],
      access: {
        // Phòng thủ kép: dù access.update ở document-level có bị nới lỏng
        // sau này (vd cho phép nhân viên tự sửa tên mình), field `roles`
        // vẫn luôn chỉ admin ghi được (cùng mô hình với Customers.segment).
        create: ({ req: { user } }) => hasRole(user, []),
        update: ({ req: { user } }) => hasRole(user, []),
      },
    },
  ],
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Restart the dev server and verify the fixes**

Log in as admin (`admin@novatech.demo` / `admin123456`) via `POST /api/users/login` and capture `<admin-token>`.

Create a throwaway `sales`-role test staff account **as admin**:

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.sales@example.com","password":"TestPass123","name":"RBAC Sales Test","roles":["sales"]}'
```

Expected: HTTP 201, `doc.roles` is `["sales"]`. Capture the returned `<sales-id>`.

Log in as that sales test account and capture `<sales-token>`:

```bash
curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rbactest.sales@example.com","password":"TestPass123"}'
```

**Self-escalation attempt** — the sales account tries to promote itself:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH "http://localhost:3000/api/users/<sales-id>" \
  -H "Content-Type: application/json" -H "Authorization: JWT <sales-token>" \
  -d '{"roles":["admin"]}'
```

Expected: `HTTP_STATUS:403` (document-level `update` is now admin-only, so the whole request is denied, not just the `roles` field).

**Public account creation attempt** — no auth at all:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"rbactest.public@example.com","password":"TestPass123"}'
```

Expected: `HTTP_STATUS:403`.

**Customer account tries to create a staff account** — register a throwaway customer, log in, then attempt:

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"RBAC Cust Test","email":"rbactest.cust@example.com","password":"TestPass123"}'
```

Capture `<cust-id>`, then log in via `POST /api/customers/login` with the same credentials to get `<cust-token>`:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <cust-token>" \
  -d '{"email":"rbactest.escalate@example.com","password":"TestPass123"}'
```

Expected: `HTTP_STATUS:403`.

**Read still works for any staff** — confirm the sales account (non-admin) can still list users:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/users -H "Authorization: JWT <sales-token>"
```

Expected: `HTTP_STATUS:200` with `docs` containing at least the admin and the sales test account.

**Read is denied for a customer account**:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/users -H "Authorization: JWT <cust-token>"
```

Expected: `HTTP_STATUS:403` (per the Global Constraints' confirmed `read: false → 403` behavior).

- [ ] **Step 4: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/users/<sales-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/customers/<cust-id>" -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 5: Commit**

```bash
git add collections/Users.ts
git commit -m "fix(rbac): lock Users create/update/delete to admin, close self-escalation gap"
```

---

## Task 3: 7 content collections — restrict write access to admin

**Files:**
- Modify: `collections/Products.ts`
- Modify: `collections/Services.ts`
- Modify: `collections/News.ts`
- Modify: `collections/Team.ts`
- Modify: `collections/Clients.ts`
- Modify: `collections/Stats.ts`
- Modify: `collections/Media.ts`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: all 7 collections keep public `read` but now require `hasRole(user, [])` (admin-only) for `create`/`update`/`delete`. Previously these fell back to Payload's default `Boolean(user)`, so any authenticated account (including a `customers`-collection account) could create/update/delete marketing content.

- [ ] **Step 1: `collections/Products.ts`**

Change the `access` line:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Products: CollectionConfig = {
  slug: "products",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    // ... existing fields unchanged, do not modify
```

(Only the `import` line and the `access` object change — the `fields` array below it is untouched.)

- [ ] **Step 2: `collections/Services.ts`**

Current file defines a shared `publicRead` const. Change it to:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Công khai cho read; ghi chỉ role admin (trước đây mặc định Boolean(user)
// của Payload — bất kỳ ai đăng nhập, kể cả khách hàng, cũng ghi được).
const publicRead: CollectionConfig["access"] = {
  read: () => true,
  create: ({ req: { user } }) => hasRole(user, []),
  update: ({ req: { user } }) => hasRole(user, []),
  delete: ({ req: { user } }) => hasRole(user, []),
};

export const Services: CollectionConfig = {
  slug: "services",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug"] },
  access: publicRead,
  fields: [
    // ... existing fields unchanged, do not modify
```

The explicit `CollectionConfig["access"]` type annotation on `publicRead` is required here (unlike the other 6 files, where the object literal is assigned directly to `access:` inside a `CollectionConfig`-typed object and gets contextual typing automatically) — without it, TypeScript cannot infer the destructured `{ req: { user } }` parameter type and `strict` mode will error.

- [ ] **Step 3: `collections/News.ts`**

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const News: CollectionConfig = {
  slug: "news",
  admin: { useAsTitle: "title", defaultColumns: ["title", "date", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    // ... existing fields unchanged, do not modify
```

- [ ] **Step 4: `collections/Team.ts`**

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Team: CollectionConfig = {
  slug: "team",
  admin: { useAsTitle: "name", defaultColumns: ["name", "role", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    // ... existing fields unchanged, do not modify
```

- [ ] **Step 5: `collections/Clients.ts`**

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    // ... existing fields unchanged, do not modify
```

- [ ] **Step 6: `collections/Stats.ts`**

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

export const Stats: CollectionConfig = {
  slug: "stats",
  admin: { useAsTitle: "label", defaultColumns: ["label", "value", "suffix"] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  fields: [
    // ... existing fields unchanged, do not modify
```

- [ ] **Step 7: `collections/Media.ts`**

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";

// Kho media (ảnh sản phẩm, banner, tài liệu...). Dùng cho các giai đoạn sau.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasRole(user, []),
    update: ({ req: { user } }) => hasRole(user, []),
    delete: ({ req: { user } }) => hasRole(user, []),
  },
  upload: true,
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Restart the dev server and verify with a non-admin test account**

As admin (`<admin-token>` from Task 2's pattern — log in again if needed), create a throwaway `editor`-role test account (editor has no elevated permission anywhere in this plan, making it a clean "definitely not admin" test subject):

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.editor@example.com","password":"TestPass123","name":"RBAC Editor Test","roles":["editor"]}'
```

Capture `<editor-id>`, then log in to get `<editor-token>` via `POST /api/users/login`.

**As the editor account, attempt to create a document in each of the 6 non-upload content collections.** Payload's access check runs before field validation, so a `403` here proves the write is blocked at the access layer regardless of what's in the body:

```bash
for slug in products services news team clients stats; do
  echo -n "$slug: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/$slug" \
    -H "Content-Type: application/json" -H "Authorization: JWT <editor-token>" \
    -d '{}'
done
```

Expected: `403` printed for all 6 lines.

**As admin, the same loop should NOT be blocked at the access layer** (it will instead fail with `400` due to missing required fields — proving access was granted and validation ran next, not that access silently passed everything):

```bash
for slug in products services news team clients stats; do
  echo -n "$slug: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/$slug" \
    -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
    -d '{}'
done
```

Expected: `400` printed for all 6 lines (not `403`).

**Media (upload collection)** — same access-layer check, editor should still be denied before any file-upload validation:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/media" \
  -H "Content-Type: application/json" -H "Authorization: JWT <editor-token>" -d '{}'
```

Expected: `403`.

**Public read is unaffected** — confirm anonymous `GET` still works:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/products
```

Expected: `200`.

- [ ] **Step 10: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/users/<editor-id>" -H "Authorization: JWT <admin-token>"
```

(No content documents were actually created — every write attempt above was denied before persisting anything, so there is nothing else to delete.)

- [ ] **Step 11: Commit**

```bash
git add collections/Products.ts collections/Services.ts collections/News.ts collections/Team.ts collections/Clients.ts collections/Stats.ts collections/Media.ts
git commit -m "fix(rbac): restrict content collection writes to admin role"
```

---

## Task 4: `Leads.ts` + `CustomerNotes.ts` — sales+admin only

**Files:**
- Modify: `collections/Leads.ts`
- Modify: `collections/CustomerNotes.ts`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: `Leads.read` and all 4 `CustomerNotes` operations now require `hasRole(user, ["admin","sales"])` instead of the previous blanket `user?.collection === "users"`.

This also resolves a previously-flagged, separately-tracked finding (`Leads.read` being readable by any internal staff regardless of role) — no separate fix needed for that elsewhere.

- [ ] **Step 1: `collections/Leads.ts`**

Change:

```ts
  access: {
    read: ({ req: { user } }) => user?.collection === "users",
    create: () => true, // Public form submission
  },
```

to:

```ts
  access: {
    read: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
    create: () => true, // Public form submission
  },
```

Add the import at the top:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";
```

- [ ] **Step 2: `collections/CustomerNotes.ts`**

Change:

```ts
  access: {
    read: ({ req: { user } }) => user?.collection === "users",
    create: ({ req: { user } }) => user?.collection === "users",
    update: ({ req: { user } }) => user?.collection === "users",
    delete: ({ req: { user } }) => user?.collection === "users",
  },
```

to:

```ts
  access: {
    read: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
    create: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
    update: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
    delete: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
  },
```

Add the import at the top:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Restart the dev server and verify**

Log in as admin, create a throwaway `sales`-role test account and an `accountant`-role test account (accountant is explicitly excluded from this area per the spec, making it a clean negative test alongside editor):

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.sales2@example.com","password":"TestPass123","name":"RBAC Sales Test 2","roles":["sales"]}'
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.acct@example.com","password":"TestPass123","name":"RBAC Accountant Test","roles":["accountant"]}'
```

Capture `<sales2-id>`/`<acct-id>`, log in to get `<sales2-token>`/`<acct-token>`.

Submit a public lead so there is something to read:

```bash
curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"RBAC Lead Test","email":"rbaclead@example.com","phone":"0900000000","subject":"Test","message":"Test"}'
```

Capture `<lead-id>`.

```bash
echo -n "sales reads leads: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/leads -H "Authorization: JWT <sales2-token>"
echo -n "accountant reads leads: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/leads -H "Authorization: JWT <acct-token>"
```

Expected: `sales` → `200`, `accountant` → `403`.

```bash
echo -n "sales creates customer-note: "
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/customer-notes \
  -H "Content-Type: application/json" -H "Authorization: JWT <sales2-token>" \
  -d '{"type":"note","content":"test"}'
echo -n "accountant reads customer-notes: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/customer-notes -H "Authorization: JWT <acct-token>"
```

Expected: sales create → `400` (missing required `customer` field — proves access was granted, not that the field was optional); accountant read → `403`.

- [ ] **Step 5: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/leads/<lead-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/users/<sales2-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/users/<acct-id>" -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 6: Commit**

```bash
git add collections/Leads.ts collections/CustomerNotes.ts
git commit -m "fix(rbac): restrict Leads read and CustomerNotes to admin+sales"
```

---

## Task 5: `Customers.ts` + `Orders.ts` — admin+sales+accountant

**Files:**
- Modify: `collections/Customers.ts`
- Modify: `collections/Orders.ts`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: the internal-staff branch of `Customers.read`/`update`/`delete` and `Orders.read` now requires `hasRole(user, ["admin","sales","accountant"])`. `Customers.segment`/`segmentOverride` field access requires `hasRole(user, ["admin","sales"])` (matches CRM's role scope, not the broader Orders/Customers scope). `Orders` gains an explicit `delete` (previously undefined, defaulting to Payload's `Boolean(user)` — any authenticated account, including a customer, could delete any order).

**Important correctness note:** the original `read`/`update` functions on `Customers`/`Orders` used the pattern `if (user.collection === "users") return true; return { id: { equals: user.id } };`. If you naively replace only the `true` with `hasRole(...)`, a **denied** internal user (e.g. an `editor`) falls through to the `{ id: { equals: user.id } }` branch — which was written assuming `user` is always a `customers`-collection account at that point. An editor's numeric `Users.id` could accidentally collide with an unrelated `Customers.id`, granting access to the wrong customer's record. The fix below keeps the `user.collection === "users"` branch returning a plain boolean (`hasRole(...)`, which can be `true` or `false`) so only an actual `customers`-collection account ever reaches the `{ id: { equals: user.id } }` line.

- [ ] **Step 1: `collections/Customers.ts`**

Change:

```ts
  access: {
    // Cho phép đăng ký công khai (khách tự tạo tài khoản).
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return true; // admin xem tất cả
      return { id: { equals: user.id } }; // khách chỉ xem chính mình
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return true;
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => user?.collection === "users",
  },
```

to:

```ts
  access: {
    // Cho phép đăng ký công khai (khách tự tạo tài khoản).
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false;
      // QUAN TRỌNG: trả thẳng boolean của hasRole (không phải luôn `true`)
      // để một nhân viên KHÔNG đủ quyền (vd editor) bị chặn hẳn ở đây, thay
      // vì rơi xuống nhánh { id: { equals: user.id } } phía dưới — nhánh đó
      // chỉ đúng khi user là tài khoản customers, dùng user.id (là Users.id
      // của editor) để lọc Customers.id sẽ vô tình khớp nhầm bản ghi khác.
      if (user.collection === "users") return hasRole(user, ["admin", "sales", "accountant"]);
      return { id: { equals: user.id } }; // khách chỉ xem chính mình
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return hasRole(user, ["admin", "sales", "accountant"]);
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => hasRole(user, ["admin", "sales", "accountant"]),
  },
```

Add the import at the top:

```ts
import type { CollectionConfig } from "payload";
import { hasRole } from "../lib/rbac";
```

Change the `segment`/`segmentOverride` field access (both fields, both `create` and `update`) from:

```ts
        create: ({ req: { user } }) => user?.collection === "users",
        update: ({ req: { user } }) => user?.collection === "users",
```

to:

```ts
        create: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
        update: ({ req: { user } }) => hasRole(user, ["admin", "sales"]),
```

(This appears twice in the file — once for `segment`, once for `segmentOverride` — change both occurrences the same way.)

- [ ] **Step 2: `collections/Orders.ts`**

Change:

```ts
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.collection === "users") return true; // admin xem tất cả đơn
      return { customer: { equals: user.id } }; // khách chỉ xem đơn của mình
    },
    // Đơn chỉ được tạo bởi khách đã đăng nhập (qua app/api/orders/route.ts,
    // route này tự xác thực bằng payload.auth() trước khi gọi payload.create)
    // hoặc bởi admin thao tác trong trang quản trị.
    create: ({ req: { user } }) => Boolean(user),
  },
```

to:

```ts
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      // Trả thẳng boolean của hasRole — cùng lý do với Customers.ts ở trên,
      // tránh một nhân viên không đủ quyền rơi xuống nhánh lọc theo user.id
      // vốn chỉ đúng cho tài khoản customers.
      if (user.collection === "users") return hasRole(user, ["admin", "sales", "accountant"]);
      return { customer: { equals: user.id } }; // khách chỉ xem đơn của mình
    },
    // Đơn chỉ được tạo bởi khách đã đăng nhập (qua app/api/orders/route.ts,
    // route này tự xác thực bằng payload.auth() trước khi gọi payload.create)
    // hoặc bởi admin thao tác trong trang quản trị.
    create: ({ req: { user } }) => Boolean(user),
    // Trước đây không định nghĩa delete nên mặc định Boolean(user) của
    // Payload — bất kỳ tài khoản đăng nhập nào (kể cả customers) xoá được
    // BẤT KỲ đơn hàng nào, không chỉ đơn của chính mình.
    delete: ({ req: { user } }) => hasRole(user, ["admin", "sales", "accountant"]),
  },
```

Add the import at the top:

```ts
import type { CollectionConfig } from "payload";
import { recomputeSegment } from "../lib/crm";
import { hasRole } from "../lib/rbac";
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Restart the dev server and verify**

Log in as admin. Create a throwaway `accountant`-role test account (already created `<acct-id>`/`<acct-token>` pattern from Task 4 if still needed — create a fresh one since Task 4's was deleted) and an `editor`-role test account (negative test — editor has no access to this area either):

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.acct2@example.com","password":"TestPass123","name":"RBAC Accountant Test 2","roles":["accountant"]}'
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.editor2@example.com","password":"TestPass123","name":"RBAC Editor Test 2","roles":["editor"]}'
```

Capture `<acct2-id>`/`<editor2-id>`, log in to get `<acct2-token>`/`<editor2-token>`.

Create a throwaway customer + order to have something to read. **Note:** `app/api/orders/route.ts` is a custom Next.js route that shadows Payload's native `/api/orders` collection endpoint (Next.js resolves the literal `app/api/orders/route.ts` path ahead of the catch-all `app/(payload)/api/[...slug]/route.ts`) — it requires a `customers`-collection session, not an admin JWT, and always force-sets `paymentStatus: "unpaid"` regardless of the request body. Log in as the customer to create the order, not as admin:

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"RBAC Order Test","email":"rbacordertest@example.com","password":"TestPass123"}'
```

Capture `<cust2-id>`, then log in as that customer via `POST /api/customers/login` to get `<cust2-token>`:

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <cust2-token>" \
  -d '{"orderNumber":"RBACTEST-1","customerName":"RBAC Order Test","customerEmail":"rbacordertest@example.com","customerPhone":"0900000000","shippingAddress":"Test","items":[{"productId":"p1","productName":"Test","quantity":1,"price":100000}],"subtotal":100000,"total":100000,"paymentMethod":"cod"}'
```

Response is `{"success":true,"orderId":<id>,"orderNumber":"RBACTEST-1"}` (this route's own response shape, not Payload's `{doc:...}` shape). Capture `<order-id>` from `orderId`.

**Note on `/api/orders`:** the bare list path `GET /api/orders` is also handled by the custom `app/api/orders/route.ts` (it exports both `POST` and `GET`, and its `GET` requires an `orderNumber` query param) — testing against the bare list path would exercise that custom handler, not Payload's native list endpoint or our new access control. Use `GET /api/orders/<order-id>` (fetch by ID) instead, which is not shadowed by any custom route and goes through Payload's own REST layer where `hasRole` is enforced (confirmed empirically: a denied `read` access returns `403` for single-document fetch too, same as list-endpoint denial):

```bash
echo -n "accountant reads order by id: "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/orders/<order-id>" -H "Authorization: JWT <acct2-token>"
echo -n "editor reads order by id: "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/orders/<order-id>" -H "Authorization: JWT <editor2-token>"
echo -n "accountant reads customers: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/customers -H "Authorization: JWT <acct2-token>"
echo -n "editor reads customers: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/customers -H "Authorization: JWT <editor2-token>"
```

Expected: both `accountant` lines → `200`; both `editor` lines → `403`.

**Segment field lock still scoped to admin+sales, not accountant** — attempt as accountant (not sales). Accountant passes the document-level `update` check (Step 1's `hasRole(user, ["admin","sales","accountant"])` allows it), but the field-level `segment` access (`["admin","sales"]`, unchanged from before this task) should silently drop just that field:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH "http://localhost:3000/api/customers/<cust2-id>" \
  -H "Content-Type: application/json" -H "Authorization: JWT <acct2-token>" \
  -d '{"segment":"vip"}'
```

Expected: `HTTP_STATUS:200`, but `doc.segment` is unchanged from before the request (still `"new"`) — the document-level write is allowed, but the field-level lock drops the disallowed `segment` key specifically, the same silent-drop behavior CRM's Task 1 relied on.

- [ ] **Step 5: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/orders/<order-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/customers/<cust2-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/users/<acct2-id>" -H "Authorization: JWT <admin-token>"
curl -s -X DELETE "http://localhost:3000/api/users/<editor2-id>" -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 6: Commit**

```bash
git add collections/Customers.ts collections/Orders.ts
git commit -m "fix(rbac): restrict Customers/Orders internal access and lock segment field to admin+sales"
```

---

## Task 6: CRM custom views, nav, and routes — admin+sales

**Files:**
- Modify: `components/admin/CrmNav.tsx`
- Modify: `components/admin/CrmListView.tsx`
- Modify: `components/admin/CrmDetailView.tsx`
- Modify: `app/api/crm/segment/route.ts`
- Modify: `app/api/crm/segment/auto/route.ts`
- Modify: `app/api/crm/note/route.ts`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: `/admin/crm` and `/admin/crm/:id` render "Không có quyền truy cập." for anyone who isn't `hasRole(user, ["admin","sales"])`; the 3 CRM route handlers 403 the same way; the "CRM" nav link only renders for `admin`/`sales`.

- [ ] **Step 1: `components/admin/CrmNav.tsx`**

Replace the entire file with:

```tsx
import type { ServerProps } from "payload";
import { hasRole } from "@/lib/rbac";

// Link "CRM" trong sidebar /admin. Chỉ hiện với role admin/sales — đây chỉ
// là UX (ẩn link cho role không dùng tới), rào chắn thật nằm ở guard trong
// CrmListView/CrmDetailView và các route /api/crm/*.
export function CrmNav({ user }: ServerProps) {
  if (!hasRole(user, ["admin", "sales"])) return null;
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

- [ ] **Step 2: `components/admin/CrmListView.tsx`**

Add the import:

```ts
import type { AdminViewServerProps } from "payload";
import { hasRole } from "@/lib/rbac";
```

Change:

```tsx
  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

to:

```tsx
  // Chỉ role admin/sales được xem CRM.
  if (!hasRole(req.user, ["admin", "sales"])) {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

- [ ] **Step 3: `components/admin/CrmDetailView.tsx`**

Add the import:

```ts
import type { AdminViewServerProps } from "payload";
import { getCustomerTimeline } from "@/lib/crm";
import { hasRole } from "@/lib/rbac";
```

Change:

```tsx
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

to:

```tsx
  if (!hasRole(req.user, ["admin", "sales"])) {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

- [ ] **Step 4: `app/api/crm/segment/route.ts`**

Add the import:

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import type { CustomerSegment } from "@/lib/crm";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";
import { hasRole } from "@/lib/rbac";
```

Change:

```ts
    if (!user || user.collection !== "users") {
```

to:

```ts
    if (!user || !hasRole(user, ["admin", "sales"])) {
```

- [ ] **Step 5: `app/api/crm/segment/auto/route.ts`**

Add the import:

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { recomputeSegment } from "@/lib/crm";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";
import { hasRole } from "@/lib/rbac";
```

Change:

```ts
    if (!user || user.collection !== "users") {
```

to:

```ts
    if (!user || !hasRole(user, ["admin", "sales"])) {
```

- [ ] **Step 6: `app/api/crm/note/route.ts`**

Add the import:

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { parseActionBody, isFormRequest, crmActionRedirect } from "@/lib/parseActionBody";
import { hasRole } from "@/lib/rbac";
```

Change:

```ts
    if (!user || user.collection !== "users") {
```

to:

```ts
    if (!user || !hasRole(user, ["admin", "sales"])) {
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Restart the dev server and verify**

Log in as admin. Create a throwaway `accountant`-role test account (excluded from CRM per the spec — clean negative test distinct from the `editor`/`sales` cases already covered elsewhere):

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.acct3@example.com","password":"TestPass123","name":"RBAC Accountant Test 3","roles":["accountant"]}'
```

Capture `<acct3-id>`, log in to get `<acct3-token>`.

```bash
echo -n "accountant hits /api/crm/segment: "
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/crm/segment \
  -H "Content-Type: application/json" -H "Authorization: JWT <acct3-token>" \
  -d '{"customerId":1,"segment":"vip"}'
```

Expected: `403`.

Open the browser at `/admin`, log in as `admin@novatech.demo` / `admin123456`, confirm the "CRM" link is visible in the sidebar and `/admin/crm` renders the customer list as before.

- [ ] **Step 9: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/users/<acct3-id>" -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 10: Commit**

```bash
git add components/admin/CrmNav.tsx components/admin/CrmListView.tsx components/admin/CrmDetailView.tsx app/api/crm/segment/route.ts app/api/crm/segment/auto/route.ts app/api/crm/note/route.ts
git commit -m "fix(rbac): restrict CRM views, nav, and routes to admin+sales"
```

---

## Task 7: Dashboard view + nav — admin+sales+accountant, final regression

**Files:**
- Modify: `components/admin/DashboardView.tsx`
- Modify: `components/admin/DashboardNav.tsx`

**Interfaces:**
- Consumes: `hasRole` (Task 1).
- Produces: `/admin/dashboard` renders "Không có quyền truy cập." for anyone who isn't `hasRole(user, ["admin","sales","accountant"])`; the "Dashboard" nav link only renders for those 3 roles.

- [ ] **Step 1: `components/admin/DashboardView.tsx`**

Add the import:

```ts
import type { AdminViewServerProps } from "payload";
import { getDashboardMetrics, type DashboardMetrics, type DashboardRange } from "@/lib/dashboard";
import { hasRole } from "@/lib/rbac";
```

Change:

```tsx
  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

to:

```tsx
  // Chỉ role admin/sales/kế toán được xem Dashboard.
  if (!hasRole(req.user, ["admin", "sales", "accountant"])) {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }
```

- [ ] **Step 2: `components/admin/DashboardNav.tsx`**

Replace the entire file with:

```tsx
import type { ServerProps } from "payload";
import { hasRole } from "@/lib/rbac";

// Link "Dashboard" trong sidebar /admin. Chỉ hiện với role admin/sales/kế
// toán — chỉ là UX, rào chắn thật nằm ở guard trong DashboardView.
export function DashboardNav({ user }: ServerProps) {
  if (!hasRole(user, ["admin", "sales", "accountant"])) return null;
  return (
    <a
      href="/admin/dashboard"
      style={{
        display: "block",
        padding: "8px 16px",
        fontWeight: 600,
      }}
    >
      Dashboard
    </a>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Restart the dev server and verify**

Log in as admin. Create a throwaway `editor`-role test account (excluded from Dashboard per the spec):

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"email":"rbactest.editor3@example.com","password":"TestPass123","name":"RBAC Editor Test 3","roles":["editor"]}'
```

Capture `<editor3-id>`, log in to get `<editor3-token>`.

Open the browser at `/admin`, log in as that editor test account. Confirm:
- No "Dashboard" link appears in the sidebar.
- Navigating directly to `/admin/dashboard` shows "Không có quyền truy cập." instead of the metrics.

Log out, log back in as `admin@novatech.demo`. Confirm:
- Both "CRM" and "Dashboard" links are visible in the sidebar.
- `/admin/dashboard` renders normally.

- [ ] **Step 5: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:3000/api/users/<editor3-id>" -H "Authorization: JWT <admin-token>"
```

- [ ] **Step 6: Final regression check across the whole plan**

Run: `npx tsc --noEmit` (expect clean).

Log in as admin in the browser and confirm each of these still works exactly as before this plan: `/admin/collections/orders`, `/admin/collections/customers`, `/admin/collections/leads`, `/admin/collections/customer-notes`, `/admin/collections/products` (and the other content collections), `/admin/crm`, `/admin/dashboard`. Confirm the public site's product/service/news pages (which read from these same collections) still render (anonymous `GET` was never restricted).

Confirm no test accounts remain: `GET /api/users` as admin should list only `admin@novatech.demo` plus whatever real accounts existed before this plan started (no `rbactest.*` accounts).

- [ ] **Step 7: Commit**

```bash
git add components/admin/DashboardView.tsx components/admin/DashboardNav.tsx
git commit -m "fix(rbac): restrict Dashboard view and nav to admin+sales+accountant"
```

---

## Self-Review Notes

- **Spec coverage:** every row of the spec's permission matrix maps to a task — `hasRole()` (Task 1), Users self-escalation fix (Task 2), content collections (Task 3), Leads/CustomerNotes (Task 4), Customers/Orders (Task 5), CRM (Task 6), Dashboard (Task 7). The spec's "Ngoài phạm vi" items (permission-management UI, scoped-by-owner data access, audit log, Users self-service editing) are deliberately not tasked.
- **Placeholder scan:** every step has literal, complete code; the one temporary artifact (`app/api/rbac/_debug-hasrole/route.ts` in Task 1) is created and explicitly deleted within the same task.
- **Type consistency:** `Role` and `hasRole(user, allowed: Role[]): boolean` are defined once in `lib/rbac.ts` (Task 1) and only ever imported, never redefined, in Tasks 2–7. The `Customers.ts`/`Orders.ts` read-access restructuring in Task 5 (returning `hasRole(...)`'s boolean directly instead of a hardcoded `true`) was caught and corrected during this self-review pass — the original spec's inline code sketch for that section would have produced a subtle wrong-record-match bug for denied internal roles.
