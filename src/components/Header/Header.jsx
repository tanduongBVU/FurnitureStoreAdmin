import { useLocation } from "react-router-dom";
import "./Header.css";

const titles = {
  "/dashboard": "Dashboard",
  "/products":  "Quản lý Sản phẩm",
  "/orders":    "Quản lý Đơn hàng",
  "/contacts":  "Quản lý Liên hệ",
  "/users":     "Quản lý Người dùng",
};

const Header = () => {
  const { pathname } = useLocation();
  const title = titles[pathname] || "Admin";
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <h1 className="admin-header__title">{title}</h1>
        <p className="admin-header__date">{today}</p>
      </div>
      <div className="admin-header__right">
        <button className="header-btn">🔔</button>
        <button className="header-btn">⚙️</button>
        <div className="header-avatar">A</div>
      </div>
    </header>
  );
};

export default Header;
