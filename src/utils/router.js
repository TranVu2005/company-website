/**
 * Hash-based SPA Router
 * 
 * Quy tắc:
 * - Route dạng #/service/s1 → điều hướng trang chi tiết
 * - Route dạng #about-root  → cuộn trang (scroll), KHÔNG xử lý bởi router
 * - Route rỗng hoặc #/     → trang chủ
 */

// Kiểm tra xem hash có phải route hay chỉ là anchor scroll
export const isRoute = (hash) => {
  if (!hash) return false;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return raw.startsWith('/');
};

// Lấy route hiện tại từ hash (vd: #/service/s1 -> { path: 'service', id: 's1' })
export const getCurrentRoute = () => {
  const hash = window.location.hash.slice(1); // Bỏ dấu #
  if (!hash || hash === '/') return { path: 'home', id: null };
  
  // Chỉ xử lý route nếu bắt đầu bằng /
  if (!hash.startsWith('/')) return { path: 'home', id: null };
  
  // Format: /path/id
  const parts = hash.split('/').filter(p => p);
  if (parts.length >= 2) {
    return { path: parts[0], id: parts[1] };
  }
  
  return { path: parts[0] || 'home', id: null };
};

// Hàm chuyển trang
export const navigateTo = (path) => {
  window.location.hash = path;
};
