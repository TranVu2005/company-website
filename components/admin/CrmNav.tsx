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
