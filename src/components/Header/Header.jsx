import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../services/Api";
import "./Header.css";

const titles = {
  "/dashboard": "Dashboard",
  "/products":  "Quản lý Sản phẩm",
  "/orders":    "Quản lý Đơn hàng",
  "/contacts":  "Quản lý Liên hệ",
  "/users":     "Quản lý Người dùng",
};

// Các link tắt hay dùng nhất trong menu cài đặt (bánh răng) — trỏ đúng theo
// route đã khai báo trong Sidebar.jsx.
const SETTINGS_SHORTCUTS = [
  { path: "/settings", icon: "🎨", label: "Giao diện Client", adminOnly: true },
  { path: "/coupons",  icon: "🎟️", label: "Mã giảm giá" },
  { path: "/users",    icon: "👥", label: "Người dùng", adminOnly: true },
];

const formatTimeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + "..." : s);

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titles[pathname] || "Admin";
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const userStr = localStorage.getItem("adminUser");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || "";
  const name = currentUser?.name || "Admin";
  const getInitial = (n) => n.trim().charAt(0).toUpperCase() || "A";

  // "openMenu" chỉ có thể là 1 trong 3 giá trị (hoặc null) — đảm bảo LUÔN chỉ
  // 1 dropdown mở tại 1 thời điểm.
  const [openMenu, setOpenMenu] = useState(null); // null | "notif" | "settings" | "avatar"
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => setOpenMenu(prev => (prev === menu ? null : menu));

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const visibleShortcuts = SETTINGS_SHORTCUTS.filter(s => !s.adminOnly || role === "Admin");

  // ── Thông báo — dùng ĐÚNG data + field đã có sẵn ở Dashboard.jsx:
  // đơn "Chờ xác nhận" (cần Admin xử lý) + liên hệ "Mới" (chưa xử lý). ──
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(true);

  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const [ordersRes, contactsRes] = await Promise.all([
          api.get("/Orders"),
          api.get("/Contacts"),
        ]);
        setOrders(ordersRes.data);
        setContacts(contactsRes.data);
      } catch {
        // Lỗi tải thông báo không nên chặn cả header — im lặng bỏ qua, chuông
        // sẽ chỉ hiện rỗng thay vì làm crash toàn bộ layout Admin.
      } finally {
        setLoadingNotif(false);
      }
    };
    fetchNotif();
  }, []);

  const pendingOrders = orders.filter(o => o.status === "Chờ xác nhận");
  const newContacts = contacts.filter(c => c.status === "Mới");

  const notifications = [
    ...pendingOrders.map(o => ({
      id: `order-${o.id}`,
      icon: "📦",
      text: `Đơn #${o.id} từ ${o.customerName} đang chờ xác nhận`,
      time: o.createdAt,
      link: "/orders",
    })),
    ...newContacts.map(c => ({
      id: `contact-${c.id}`,
      icon: "✉️",
      text: `Liên hệ mới từ ${c.name}${c.message ? ": " + truncate(c.message, 40) : ""}`,
      time: c.createdAt,
      link: "/contacts",
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const notifCount = notifications.length;

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <h1 className="admin-header__title">{title}</h1>
        <p className="admin-header__date">{today}</p>
      </div>
      <div className="admin-header__right" ref={wrapperRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>

        {/* ── CHUÔNG THÔNG BÁO ── */}
        <div style={{ position: "relative" }}>
          <button className="header-btn" onClick={() => toggleMenu("notif")} style={{ position: "relative" }}>
            🔔
            {notifCount > 0 && (
              <span style={badgeDotStyle}>{notifCount > 9 ? "9+" : notifCount}</span>
            )}
          </button>
          {openMenu === "notif" && (
            <div style={{ ...dropdownStyle, minWidth: 320, maxHeight: 380, overflowY: "auto" }}>
              <div style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#3b2a1a", borderBottom: "1px solid #eee2d0", position: "sticky", top: 0, background: "#fff" }}>
                Thông báo {notifCount > 0 && `(${notifCount})`}
              </div>
              {loadingNotif ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9a8a76" }}>Đang tải...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9a8a76" }}>
                  🎉 Không có thông báo mới nào.
                </div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setOpenMenu(null)}
                    style={{ ...dropdownItemStyle, alignItems: "flex-start", borderBottom: "1px solid #f5f0e8" }}
                  >
                    <span>{n.icon}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ lineHeight: 1.4 }}>{n.text}</span>
                      <span style={{ fontSize: 11.5, color: "#9a8a76" }}>{formatTimeAgo(n.time)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── BÁNH RĂNG CÀI ĐẶT ── */}
        <div style={{ position: "relative" }}>
          <button className="header-btn" onClick={() => toggleMenu("settings")}>⚙️</button>
          {openMenu === "settings" && (
            <div style={dropdownStyle}>
              {visibleShortcuts.map(s => (
                <Link
                  key={s.path}
                  to={s.path}
                  onClick={() => setOpenMenu(null)}
                  style={dropdownItemStyle}
                >
                  <span>{s.icon}</span> {s.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── AVATAR ── */}
        <div style={{ position: "relative" }}>
          <div className="header-avatar" onClick={() => toggleMenu("avatar")} style={{ cursor: "pointer" }}>
            {getInitial(name)}
          </div>
          {openMenu === "avatar" && (
            <div style={{ ...dropdownStyle, right: 0, minWidth: 200 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee2d0" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#3b2a1a" }}>{name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9a8a76" }}>{role || "Quản trị viên"}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{ ...dropdownItemStyle, width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer", color: "#b91c1c" }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

// Style dùng chung cho các panel dropdown — để inline vì Header.css hiện tại
// chỉ style riêng phần header-btn/header-avatar gốc, chưa có class cho dropdown.
const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 12px 32px rgba(59,42,26,.18)",
  border: "1px solid #eee2d0",
  minWidth: 220,
  zIndex: 50,
  overflow: "hidden",
};

const dropdownItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  fontSize: 14,
  color: "#3b2a1a",
  textDecoration: "none",
  transition: "background .15s",
};

const badgeDotStyle = {
  position: "absolute",
  top: -4,
  right: -4,
  background: "#b91c1c",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 3px",
  lineHeight: 1,
};

export default Header;