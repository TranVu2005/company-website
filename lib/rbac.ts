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
