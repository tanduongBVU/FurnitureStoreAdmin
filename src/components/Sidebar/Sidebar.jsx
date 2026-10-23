import { NavLink } from "react-router-dom";
import useAdminUser from "../../hooks/useAdminUser";
import "./Sidebar.css";

const navItems = [
  { path: "/dashboard",  icon: "📊", label: "Dashboard" },
  { path: "/products",   icon: "🪑", label: "Sản phẩm" },
  { path: "/bundles",    icon: "🎁", label: "Combo" },
  { path: "/services",   icon: "🛠️", label: "Dịch vụ" },
  { path: "/blogposts",  icon: "📝", label: "Cẩm nang" },
  { path: "/reviews",    icon: "⭐", label: "Đánh giá" },
  { path: "/orders",     icon: "📦", label: "Đơn hàng" },
  { path: "/contacts",   icon: "✉️",  label: "Liên hệ" },
  { path: "/coupons",    icon: "🎟️", label: "Mã giảm giá" },
  { path: "/users",      icon: "👥", label: "Người dùng", adminOnly: true },
  { path: "/settings",   icon: "🎨", label: "Giao diện" },
];

// Thanh bên CHỈ còn logo + menu quản lý. Tên, ảnh đại diện, "Thông tin cá nhân" và "Đăng xuất"
// nằm ở menu avatar góc trên bên phải (components/Header) — trước đây khối người dùng + nút
// Đăng xuất bị lặp ở cả 2 nơi.
const Sidebar = () => {
  const currentUser = useAdminUser();
  const role = currentUser?.role || "";

  const visibleItems = navItems.filter(item => !item.adminOnly || role === "Admin");

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">⬡</span>
        <div>
          <span className="sidebar__logo-text">LuxWood</span>
          <span className="sidebar__logo-sub">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <p className="sidebar__group-label">Quản lý</p>
        {visibleItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <span className="sidebar__icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;