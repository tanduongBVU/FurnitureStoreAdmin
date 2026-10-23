import { useState, useEffect } from "react";
import api from "../services/Api";

// Đọc người dùng đang đăng nhập trang quản trị (lưu ở localStorage lúc đăng nhập).
const read = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    return null;
  }
};

// Ghi đè một phần thông tin vào adminUser và báo cho Sidebar/Header cập nhật ngay (không cần tải lại trang).
export const updateStoredAdminUser = (patch) => {
  const current = read();
  if (!current) return;
  localStorage.setItem("adminUser", JSON.stringify({ ...current, ...patch }));
  window.dispatchEvent(new Event("adminUserUpdated"));
};

let syncedForId = null; // chỉ đồng bộ với Backend 1 lần cho mỗi tài khoản (Sidebar và Header cùng dùng hook này)

// Hook dùng chung cho Sidebar và Header: luôn có tên/ảnh đại diện mới nhất.
// Lúc đăng nhập chỉ lưu { id, name, email, role } nên ảnh đại diện được lấy bổ sung từ /Auth/me một lần.
export default function useAdminUser() {
  const [user, setUser] = useState(read);

  useEffect(() => {
    const sync = () => setUser(read());
    window.addEventListener("adminUserUpdated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("adminUserUpdated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || syncedForId === user.id) return;
    syncedForId = user.id;
    api
      .get("/Auth/me")
      .then((res) => {
        const cur = read();
        if (!cur) return;
        const name = res.data.name || cur.name;
        const avatarUrl = res.data.avatarUrl || "";
        if (name !== cur.name || (cur.avatarUrl || "") !== avatarUrl) {
          updateStoredAdminUser({ name, avatarUrl });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  return user;
}