import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/products",  icon: "🪑", label: "Sản phẩm" },
  { path: "/orders",    icon: "📦", label: "Đơn hàng" },
  { path: "/contacts",  icon: "✉️",  label: "Liên hệ" },
  { path: "/users",     icon: "👥", label: "Người dùng" },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
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
        {navItems.map(({ path, icon, label }) => (
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
          <div className="sidebar__avatar">A</div>
          <div>
            <p className="sidebar__admin-name">Admin</p>
            <p className="sidebar__admin-role">Quản trị viên</p>
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
