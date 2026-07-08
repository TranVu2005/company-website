import type { ServerProps } from "payload";
import Link from "next/link";
import { hasRole } from "@/lib/rbac";

// Link "CRM" trong sidebar /admin. Chỉ hiện với role admin/sales — đây chỉ
// là UX (ẩn link cho role không dùng tới), rào chắn thật nằm ở guard trong
// CrmListView/CrmDetailView và các route /api/crm/*.
export function CrmNav({ user }: ServerProps) {
  if (!hasRole(user, ["admin", "sales"])) return null;
  return (
    <Link
      href="/admin/crm"
      style={{
        display: "block",
        padding: "8px 16px",
        fontWeight: 600,
      }}
    >
      CRM
    </Link>
  );
}
