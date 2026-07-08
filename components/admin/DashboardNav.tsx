import type { ServerProps } from "payload";
import Link from "next/link";
import { hasRole } from "@/lib/rbac";

// Link "Dashboard" trong sidebar /admin. Chỉ hiện với role admin/sales/kế
// toán — chỉ là UX, rào chắn thật nằm ở guard trong DashboardView.
export function DashboardNav({ user }: ServerProps) {
  if (!hasRole(user, ["admin", "sales", "accountant"])) return null;
  return (
    <Link
      href="/admin/dashboard"
      style={{
        display: "block",
        padding: "8px 16px",
        fontWeight: 600,
      }}
    >
      Dashboard
    </Link>
  );
}
