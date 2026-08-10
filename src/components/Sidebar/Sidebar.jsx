import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/products",  icon: "🪑", label: "Sản phẩm" },
  { path: "/orders",    icon: "📦", label: "Đơn hàng" },
  { path: "/contacts",  icon: "✉️",  label: "Liên hệ" },
  { path: "/users",     icon: "👥", label: "Người dùng", adminOnly: true },
  { path: "/settings",  icon: "🎨", label: "Giao diện", adminOnly: true },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem("adminUser");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || "";
  const name = currentUser?.name || "Admin";

  const visibleItems = navItems.filter(item => !item.adminOnly || role === "Admin");

  const getInitial = (n) => n.trim().charAt(0).toUpperCase() || "A";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

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

      {/* Bottom */}
      <div className="sidebar__bottom">
        <div className="sidebar__admin-info">
          <div className="sidebar__avatar">{getInitial(name)}</div>
          <div>
            <p className="sidebar__admin-name">{name}</p>
            <p className="sidebar__admin-role">{role || "Quản trị viên"}</p>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
