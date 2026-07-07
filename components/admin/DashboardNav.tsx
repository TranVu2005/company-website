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
