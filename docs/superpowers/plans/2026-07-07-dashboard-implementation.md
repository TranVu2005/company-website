# Dashboard quản trị (Giai đoạn 3 — Phần 2A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time-computed admin dashboard (revenue, order count, average order value, daily revenue trend, top-5 best-selling products) for paid orders, filterable by Hôm nay/7 ngày/30 ngày, mounted as a custom view inside the existing Payload `/admin`.

**Architecture:** One new pure module (`lib/dashboard.ts`) that queries `Orders` for `paymentStatus: "paid"` within a date range and aggregates revenue/count/trend/top-products in JS (no N+1 queries, no new collection), plus one new Payload custom admin view (`DashboardView`) and a nav link — both rendered inside `/admin`, which already requires a `users` session. This mirrors the CRM feature's established pattern (see `components/admin/CrmListView.tsx`, `lib/crm.ts`).

**Tech Stack:** Next.js 15 (App Router) + Payload CMS 3.85.1 (Local API) + Postgres (Neon). No dedicated test runner exists in this repo (see Global Constraints). No new npm dependency — the trend chart is hand-rolled SVG.

**Spec:** [docs/superpowers/specs/2026-07-07-dashboard-design.md](../specs/2026-07-07-dashboard-design.md)

## Global Constraints

- No automated test framework (no jest/vitest/pytest) is installed in this repo — `package.json` only has `dev`/`build`/`start`/`lint` scripts. Verification in this plan therefore uses **`npx tsc --noEmit`** (must be clean after every task) plus **manual curl checks against the running dev server** and **manual browser checks**, mirroring how the CRM feature in this project was verified.
- Dev server: start via the Preview tool (`npm run dev`, Next.js on `localhost:3000`). Restart the dev server whenever `payload.config.ts` changes (new custom admin view/nav link registered) — Payload's config/schema is cached at process init, and a plain Fast Refresh is not enough. Plain `lib/`/API-route file changes (no `payload.config.ts` change) are picked up automatically by Next's dev compiler on the next request — no restart needed for those.
- `npx payload generate:importmap` is **broken in this environment** (Node 24 + `tsx` ESM resolver incompatibility, confirmed independently, unrelated to this feature) — do not rely on it or treat its failure as a blocker. The dev server automatically regenerates `app/(payload)/admin/importMap.js` on restart whenever `admin.components.*` changes, which is sufficient.
- All aggregation must only count orders with `paymentStatus === "paid"` — this exact predicate is reused verbatim in every task (matches the CRM segment logic's own paid-order filter in `lib/crm.ts`).
- `Orders.items` is an embedded array field (`productId`, `productName`, `quantity`, `price` — all plain text/number), **not** a Payload relationship. It is never subject to Payload's relationship-population `depth` behavior, unlike `Orders.customer`. Still pass `depth: 0` on the orders query for consistency with `CrmListView.tsx`'s established convention, even though it isn't strictly required here.
- This repo has no generated `payload-types.ts` (not committed, not present) — Local API `payload.find`/`payload.create` results are loosely typed. Do not import or reference `payload-types.ts`; access document fields directly like the existing `lib/crm.ts` does.
- Clean up any test customers/orders created during manual verification (delete via REST as the `users` admin) before marking a task done — established project convention.
- Admin login for manual verification: `admin@novatech.demo` / `admin123456` (existing seeded `users` account).
- Do not commit `.next` or any scratch artifacts. Commit only the source files each task touches.

---

## File Structure

```
lib/dashboard.ts                     CREATE  parseDashboardRange, getDashboardMetrics, DashboardMetrics/DashboardRange types
components/admin/DashboardNav.tsx    CREATE  "Dashboard" link in admin sidebar
components/admin/DashboardView.tsx   CREATE  range filter + summary cards + SVG trend chart + top-5 table (Server Component)
payload.config.ts                    MODIFY  register dashboard custom view + nav link
```

---

## Task 1: Metrics computation — `lib/dashboard.ts`

**Files:**
- Create: `lib/dashboard.ts`
- Test: temporary debug route `app/api/dashboard/_debug-metrics/route.ts` (created and removed within this task — no test framework, see Global Constraints)

**Interfaces:**
- Consumes: `Orders` (existing fields: `paymentStatus`, `total`, `createdAt`, `items[].productId/productName/quantity`).
- Produces: `export type DashboardRange = "today" | "7d" | "30d"`, `export type DashboardMetrics = { range, totalRevenue, orderCount, averageOrderValue, dailyTrend: {date,total}[], topProducts: {productId,productName,quantitySold}[] }`, `export function parseDashboardRange(value: unknown): DashboardRange`, `export async function getDashboardMetrics(payload: Payload, rangeInput: unknown): Promise<DashboardMetrics>` — Task 2's `DashboardView` imports all of these by these exact names.

- [ ] **Step 1: Create `lib/dashboard.ts`**

```ts
import "server-only";
import type { Payload } from "payload";

export type DashboardRange = "today" | "7d" | "30d";

export type DashboardMetrics = {
  range: DashboardRange;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  dailyTrend: { date: string; total: number }[];
  topProducts: { productId: string; productName: string; quantitySold: number }[];
};

const RANGE_DAYS: Record<DashboardRange, number> = { today: 1, "7d": 7, "30d": 30 };

export function parseDashboardRange(value: unknown): DashboardRange {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d";
}

function getRangeBounds(range: DashboardRange): { start: Date; end: Date; days: number } {
  const days = RANGE_DAYS[range];
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start, end, days };
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Tính doanh thu/số đơn/AOV/xu hướng theo ngày/top sản phẩm bán chạy từ các
 * đơn đã thanh toán (paymentStatus === "paid") trong khoảng thời gian chọn.
 * Dùng createdAt làm mốc thời gian vì Orders không có field riêng cho thời
 * điểm thanh toán (giới hạn đã ghi trong spec).
 */
export async function getDashboardMetrics(payload: Payload, rangeInput: unknown): Promise<DashboardMetrics> {
  const range = parseDashboardRange(rangeInput);
  const { start, end, days } = getRangeBounds(range);

  const paidOrders = await payload.find({
    collection: "orders",
    where: {
      paymentStatus: { equals: "paid" },
      createdAt: { greater_than_equal: start.toISOString(), less_than_equal: end.toISOString() },
    },
    limit: 0,
    depth: 0,
  });

  let totalRevenue = 0;
  const revenueByDay = new Map<string, number>();
  const quantityByProduct = new Map<string, { productName: string; quantitySold: number }>();

  for (const order of paidOrders.docs) {
    totalRevenue += order.total || 0;

    const key = dateKey(new Date(order.createdAt));
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + (order.total || 0));

    for (const item of order.items || []) {
      const prev = quantityByProduct.get(item.productId) || { productName: item.productName, quantitySold: 0 };
      quantityByProduct.set(item.productId, {
        productName: item.productName,
        quantitySold: prev.quantitySold + (item.quantity || 0),
      });
    }
  }

  const dailyTrend: { date: string; total: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    dailyTrend.push({ date: key, total: revenueByDay.get(key) || 0 });
  }

  const topProducts = [...quantityByProduct.entries()]
    .map(([productId, { productName, quantitySold }]) => ({ productId, productName, quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  const orderCount = paidOrders.docs.length;
  const averageOrderValue = orderCount === 0 ? 0 : totalRevenue / orderCount;

  return { range, totalRevenue, orderCount, averageOrderValue, dailyTrend, topProducts };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Create a temporary debug route to exercise `getDashboardMetrics`**

There is no UI yet (that's Task 2) and no test runner. Create
`app/api/dashboard/_debug-metrics/route.ts`:

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { getDashboardMetrics } from "@/lib/dashboard";

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user || user.collection !== "users") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const range = new URL(request.url).searchParams.get("range");
  const metrics = await getDashboardMetrics(payload, range);
  return Response.json(metrics);
}
```

- [ ] **Step 4: Verify aggregation, range bucketing, and paid-only filtering end-to-end**

Log in as admin (`admin@novatech.demo` / `admin123456`) via `POST /api/users/login` and capture `<admin-token>`.

Register a temporary test customer:

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Dashboard Test","email":"dashtest1@example.com","password":"TestPass123"}'
```

Capture the returned customer id as `<cust-id>`.

Compute three timestamps (today, 3 days ago, 10 days ago) so the test spans
all three range buckets without ambiguity:

```bash
DASH_TODAY_ISO=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
DASH_3D_AGO_ISO=$(date -u -d "3 days ago" +"%Y-%m-%dT%H:%M:%S.000Z")
DASH_10D_AGO_ISO=$(date -u -d "10 days ago" +"%Y-%m-%dT%H:%M:%S.000Z")
```

Create four orders as admin (Payload's create operation only auto-fills
`createdAt` when it is absent from the payload — passing it explicitly
backdates the document, per `node_modules/@payloadcms/drizzle/dist/upsertRow/index.js:21-22`):

Order A — today, paid, product P1 x2 (total 500,000đ):

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d "{\"customer\":\"<cust-id>\",\"orderNumber\":\"DASHTEST-A\",\"customerName\":\"Dashboard Test\",\"customerEmail\":\"dashtest1@example.com\",\"customerPhone\":\"0900000000\",\"shippingAddress\":\"Test\",\"items\":[{\"productId\":\"P1\",\"productName\":\"Sản phẩm A\",\"quantity\":2,\"price\":250000}],\"subtotal\":500000,\"total\":500000,\"paymentStatus\":\"paid\",\"createdAt\":\"$DASH_TODAY_ISO\"}"
```

Order B — 3 days ago, paid, product P2 x1 (total 1,000,000đ):

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d "{\"customer\":\"<cust-id>\",\"orderNumber\":\"DASHTEST-B\",\"customerName\":\"Dashboard Test\",\"customerEmail\":\"dashtest1@example.com\",\"customerPhone\":\"0900000000\",\"shippingAddress\":\"Test\",\"items\":[{\"productId\":\"P2\",\"productName\":\"Sản phẩm B\",\"quantity\":1,\"price\":1000000}],\"subtotal\":1000000,\"total\":1000000,\"paymentStatus\":\"paid\",\"createdAt\":\"$DASH_3D_AGO_ISO\"}"
```

Order C — 10 days ago, paid, product P1 x5 (total 2,000,000đ):

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d "{\"customer\":\"<cust-id>\",\"orderNumber\":\"DASHTEST-C\",\"customerName\":\"Dashboard Test\",\"customerEmail\":\"dashtest1@example.com\",\"customerPhone\":\"0900000000\",\"shippingAddress\":\"Test\",\"items\":[{\"productId\":\"P1\",\"productName\":\"Sản phẩm A\",\"quantity\":5,\"price\":250000}],\"subtotal\":2000000,\"total\":2000000,\"paymentStatus\":\"paid\",\"createdAt\":\"$DASH_10D_AGO_ISO\"}"
```

Order D — today, **unpaid** (must never be counted), total 999,999đ:

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d "{\"customer\":\"<cust-id>\",\"orderNumber\":\"DASHTEST-D\",\"customerName\":\"Dashboard Test\",\"customerEmail\":\"dashtest1@example.com\",\"customerPhone\":\"0900000000\",\"shippingAddress\":\"Test\",\"items\":[{\"productId\":\"P3\",\"productName\":\"Sản phẩm C\",\"quantity\":1,\"price\":999999}],\"subtotal\":999999,\"total\":999999,\"paymentStatus\":\"unpaid\",\"createdAt\":\"$DASH_TODAY_ISO\"}"
```

Now query the debug route for each range:

```bash
curl -s "http://localhost:3000/api/dashboard/_debug-metrics?range=today" -H "Authorization: JWT <admin-token>"
curl -s "http://localhost:3000/api/dashboard/_debug-metrics?range=7d" -H "Authorization: JWT <admin-token>"
curl -s "http://localhost:3000/api/dashboard/_debug-metrics?range=30d" -H "Authorization: JWT <admin-token>"
curl -s "http://localhost:3000/api/dashboard/_debug-metrics?range=bogus" -H "Authorization: JWT <admin-token>"
```

Expected:
- `range=today`: `totalRevenue: 500000`, `orderCount: 1`, `averageOrderValue: 500000`, `dailyTrend` has exactly 1 entry with `total: 500000`, `topProducts: [{productId:"P1",productName:"Sản phẩm A",quantitySold:2}]`. Order D's 999,999đ never appears anywhere in the response.
- `range=7d`: includes Order A + B only (Order C is 10 days ago, outside the 7-day window). `totalRevenue: 1500000`, `orderCount: 2`, `dailyTrend` has exactly 7 entries (only two of them non-zero), `topProducts` is `[{productId:"P1",...,quantitySold:2}, {productId:"P2",...,quantitySold:1}]` (P1 ranked first — higher quantity).
- `range=30d`: includes A + B + C. `totalRevenue: 3500000`, `orderCount: 3`, `dailyTrend` has exactly 30 entries, `topProducts` is `[{productId:"P1",...,quantitySold:7}, {productId:"P2",...,quantitySold:1}]` (P1's quantity is now 2+5=7, aggregated across Orders A and C).
- `range=bogus`: falls back to the same result as `range=7d` (invalid input defaults to `"7d"`, per `parseDashboardRange`).

- [ ] **Step 5: Remove the debug route and clean up test data**

Delete `app/api/dashboard/_debug-metrics/route.ts` entirely (it was only for
manually exercising `getDashboardMetrics` before the real UI exists in Task 2).

Delete orders A–D (`DELETE /api/orders/<orderId>` with admin token) and the
test customer `<cust-id>`.

- [ ] **Step 6: Typecheck again (debug route removed)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/dashboard.ts
git commit -m "feat(dashboard): add revenue/order/best-seller metrics computation"
```

---

## Task 2: Custom admin view — Dashboard

**Files:**
- Create: `components/admin/DashboardNav.tsx`
- Create: `components/admin/DashboardView.tsx`
- Modify: `payload.config.ts:29-43` (admin.components block)

**Interfaces:**
- Consumes: `getDashboardMetrics`, `DashboardMetrics`, `DashboardRange` (Task 1, `lib/dashboard.ts`).
- Produces: `/admin/dashboard` page, with a "Dashboard" link in the admin sidebar next to "CRM".

- [ ] **Step 1: Create `components/admin/DashboardNav.tsx`**

```tsx
// Link "Dashboard" trong sidebar /admin. Không tự kiểm tra quyền ở đây —
// toàn bộ khung /admin (admin.user = Users.slug trong payload.config.ts) đã
// chỉ cho tài khoản "users" đăng nhập được vào, giống CrmNav.tsx.
export function DashboardNav() {
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

- [ ] **Step 2: Create `components/admin/DashboardView.tsx`**

```tsx
import type { AdminViewServerProps } from "payload";
import { getDashboardMetrics, type DashboardMetrics, type DashboardRange } from "@/lib/dashboard";

const RANGE_LABELS: Record<DashboardRange, string> = {
  today: "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
};

const RANGES: DashboardRange[] = ["today", "7d", "30d"];

function formatCurrency(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function TrendChart({ dailyTrend }: { dailyTrend: DashboardMetrics["dailyTrend"] }) {
  const width = 600;
  const height = 160;
  const barGap = 4;
  const barWidth = (width - barGap * (dailyTrend.length - 1)) / dailyTrend.length;
  const maxTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, background: "#f8fafc" }}>
      {dailyTrend.map((point, index) => {
        const barHeight = (point.total / maxTotal) * (height - 24);
        const x = index * (barWidth + barGap);
        const y = height - 24 - barHeight;
        return (
          <g key={point.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="#2563eb" />
            <title>{`${point.date}: ${formatCurrency(point.total)}`}</title>
            <text x={x + barWidth / 2} y={height - 8} fontSize={9} textAnchor="middle" fill="#475569">
              {point.date.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export async function DashboardView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;

  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  const rangeParam = typeof searchParams?.range === "string" ? searchParams.range : undefined;
  const metrics = await getDashboardMetrics(req.payload, rangeParam);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard — Đơn hàng &amp; Doanh thu</h1>

      <div style={{ margin: "12px 0" }}>
        {RANGES.map((r, i) => (
          <span key={r}>
            {i > 0 ? " · " : ""}
            {metrics.range === r ? (
              <strong>{RANGE_LABELS[r]}</strong>
            ) : (
              <a href={`/admin/dashboard?range=${r}`}>{RANGE_LABELS[r]}</a>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, margin: "16px 0" }}>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Doanh thu</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Số đơn</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{metrics.orderCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Giá trị đơn trung bình</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.averageOrderValue)}</div>
        </div>
      </div>

      {metrics.dailyTrend.length > 1 ? (
        <section style={{ margin: "16px 0" }}>
          <h2>Xu hướng doanh thu theo ngày</h2>
          <TrendChart dailyTrend={metrics.dailyTrend} />
        </section>
      ) : null}

      <section>
        <h2>Top 5 sản phẩm bán chạy</h2>
        {metrics.topProducts.length === 0 ? (
          <p>Chưa có dữ liệu.</p>
        ) : (
          <table style={{ width: "100%", maxWidth: 500, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Sản phẩm</th>
                <th style={{ textAlign: "right" }}>Số lượng bán</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topProducts.map((p) => (
                <tr key={p.productId}>
                  <td>{p.productName}</td>
                  <td style={{ textAlign: "right" }}>{p.quantitySold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
```

(`dailyTrend.length > 1` gates the chart: for `range=today`, `dailyTrend` has
exactly 1 entry — a single bar has no comparative value, so the summary cards
above already convey that number and no chart is rendered, per the spec.)

- [ ] **Step 3: Register the view and nav link in `payload.config.ts`**

The `admin.components` block currently reads (lines 29-43):

```ts
    components: {
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
      beforeNavLinks: ["/components/admin/CrmNav#CrmNav"],
    },
```

Replace it with:

```ts
    components: {
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
        dashboard: {
          Component: "/components/admin/DashboardView#DashboardView",
          path: "/dashboard",
          exact: true,
        },
      },
      beforeNavLinks: ["/components/admin/CrmNav#CrmNav", "/components/admin/DashboardNav#DashboardNav"],
    },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Restart the dev server**

New custom admin view registered in `payload.config.ts` — restart (per Global
Constraints, this also regenerates the import map automatically; do not run
`npx payload generate:importmap` directly, it fails in this environment).

- [ ] **Step 6: Verify in the browser with real data**

Create one temporary paid test order so the dashboard has non-zero data to
render (reuse the customer-creation pattern from Task 1 Step 4, or reuse any
existing customer id already in the database):

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Dashboard Test 2","email":"dashtest2@example.com","password":"TestPass123"}'
```

Capture `<cust-id-2>`, then create a paid order for today:

```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Authorization: JWT <admin-token>" \
  -d '{"customer":"<cust-id-2>","orderNumber":"DASHTEST-E","customerName":"Dashboard Test 2","customerEmail":"dashtest2@example.com","customerPhone":"0900000000","shippingAddress":"Test","items":[{"productId":"P1","productName":"Sản phẩm A","quantity":3,"price":300000}],"subtotal":900000,"total":900000,"paymentStatus":"paid"}'
```

Open `http://localhost:3000/admin`, log in as `admin@novatech.demo` /
`admin123456`. Confirm:
- A "Dashboard" link appears in the sidebar, next to "CRM" (from `beforeNavLinks`).
- Clicking it navigates to `/admin/dashboard?range=7d`-equivalent default view (no query param) showing "7 ngày" as the active filter, with **Doanh thu: 900.000đ**, **Số đơn: 1**, **Giá trị đơn trung bình: 900.000đ**.
- The trend chart renders 7 bars, one of them (today) taller than the rest (which are 0).
- The top-5 table shows "Sản phẩm A — 3".
- Clicking "Hôm nay" and "30 ngày" re-renders the page with the same totals (only one order exists, so all three ranges show identical numbers here) and the correct number of chart bars (1 for today — rendered as cards only, no chart; 30 for 30 ngày).

Delete the test order `DASHTEST-E` and customer `<cust-id-2>`.

- [ ] **Step 7: Verify the empty state**

With all dashboard test data now deleted, reload `/admin/dashboard`. Confirm:
- All three summary cards show `0đ` / `0` / `0đ` without throwing an error.
- No chart is rendered for `range=today` (single data point); for `7d`/`30d` a chart with all-zero bars renders without error.
- The top-5 table shows "Chưa có dữ liệu." instead of an empty table.

- [ ] **Step 8: Final regression check**

Run: `npx tsc --noEmit` (expect clean).

In the browser, confirm the pre-existing admin pages still load normally:
`/admin/collections/orders`, `/admin/collections/customers`, `/admin/crm`
(CRM list view from the prior feature) all open without errors.

- [ ] **Step 9: Commit**

```bash
git add components/admin/DashboardNav.tsx components/admin/DashboardView.tsx payload.config.ts
git commit -m "feat(dashboard): add admin dashboard view (revenue, orders, best sellers)"
```

---

## Self-Review Notes

- **Spec coverage:** data model/metrics computation → Task 1; range filter UI, summary cards, trend chart, top-5 table, security guard → Task 2. The spec's accepted `createdAt`-vs-"paid-at" limitation is carried into `lib/dashboard.ts`'s doc comment. The "today range shows a card instead of a 1-bar chart" UI decision from the spec is implemented via the `dailyTrend.length > 1` gate in `DashboardView.tsx`.
- **Type consistency:** `DashboardRange`, `DashboardMetrics`, `parseDashboardRange`, `getDashboardMetrics` are defined once in `lib/dashboard.ts` (Task 1) and only ever imported, never redefined, in Task 2.
- **No placeholders:** every step has literal, complete code. The one temporary artifact (`app/api/dashboard/_debug-metrics/route.ts` in Task 1) is explicitly created and then explicitly deleted within the same task, not left dangling. `<cust-id>`/`<admin-token>`/`<cust-id-2>` placeholders refer to values obtained from a preceding step's live JSON response (same convention as the CRM plan), not unfilled requirements.
