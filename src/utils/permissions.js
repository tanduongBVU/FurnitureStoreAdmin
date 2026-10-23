// Đọc vai trò người dùng đang đăng nhập trang quản trị (lưu ở localStorage lúc đăng nhập).
// Dùng chung cho mọi trang để quyết định ẩn/hiện menu, nút xoá, số liệu nhạy cảm...
// LƯU Ý: ẩn trên giao diện chỉ để gọn và tránh bấm nhầm — việc CHẶN THẬT phải làm ở Backend
// bằng [Authorize(Roles = "...")], vì nhân viên vẫn có thể gõ thẳng đường dẫn hoặc gọi API.

export const ROLE_ADMIN = "Admin";
export const ROLE_STAFF = "Nhân viên";
export const ADMIN_PANEL_ROLES = [ROLE_ADMIN, ROLE_STAFF];

export const getAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    return null;
  }
};

export const isAdmin = () => getAdminUser()?.role === ROLE_ADMIN;
export const isStaff = () => getAdminUser()?.role === ROLE_STAFF;