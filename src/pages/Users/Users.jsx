import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./Users.css";

const ROLES = ["Tất cả", "Khách hàng", "Nhân viên", "Admin"];
const STATUS_LIST = ["Tất cả", "Hoạt động", "Bị khoá"];
const STATUS_CLASS = { "Hoạt động": "badge--success", "Bị khoá": "badge--danger" };
const ROLE_CLASS   = { "Admin": "role--admin", "Nhân viên": "role--staff", "Khách hàng": "role--customer" };
const AVATAR_COLOR = { "Admin": "#4f72e3", "Nhân viên": "#f59e0b", "Khách hàng": "#22c55e" };
const PAGE_SIZE = 6;

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage]             = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Users");
      setUsers(res.data);
    } catch {
      setError("Không thể tải danh sách người dùng. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Hoạt động" ? "Bị khoá" : "Hoạt động";
    const actionText = user.status === "Hoạt động" ? "khoá" : "mở khoá";
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản "${user.name}" không?`)) return;
    try {
      await api.patch(`/Users/${user.id}/status`, JSON.stringify(newStatus), {
        headers: { "Content-Type": "application/json" }
      });
      await fetchUsers();
    } catch {
      alert("Lỗi khi cập nhật trạng thái!");
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "Tất cả" || u.role === roleFilter;
    const matchStatus = statusFilter === "Tất cả" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getAvatar = (name = "") => name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="users-page">

      {/* Stats */}
      <div className="user-stats">
        <div className="user-stat"><span>👥</span><div><strong>{users.length}</strong><p>Tổng người dùng</p></div></div>
        <div className="user-stat"><span>🛒</span><div><strong>{users.filter(u => u.role === "Khách hàng").length}</strong><p>Khách hàng</p></div></div>
        <div className="user-stat"><span>👔</span><div><strong>{users.filter(u => u.role === "Nhân viên").length}</strong><p>Nhân viên</p></div></div>
        <div className="user-stat"><span>✅</span><div><strong>{users.filter(u => u.status === "Hoạt động").length}</strong><p>Đang hoạt động</p></div></div>
      </div>

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Tìm tên hoặc email..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-row">
            <div className="filter-tabs">
              {ROLES.map(r => (
                <button key={r} className={`filter-tab ${roleFilter === r ? "filter-tab--active" : ""}`}
                  onClick={() => { setRoleFilter(r); setPage(1); }}>{r}</button>
              ))}
            </div>
            <select className="status-select" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-add" onClick={() => navigate("/users/create")}>+ Thêm người dùng</button>
      </div>

      {/* Error */}
      {error && <div className="error-box">⚠️ {error} <button onClick={fetchUsers}>Thử lại</button></div>}

      {/* Loading */}
      {loading ? (
        <div className="loading-box"><div className="spinner" /><p>Đang tải người dùng...</p></div>
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th>
                  <th>Đơn hàng</th><th>Ngày tham gia</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">Không tìm thấy người dùng nào</td></tr>
                ) : paginated.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: AVATAR_COLOR[u.role] || "#888" }}>
                          {getAvatar(u.name)}
                        </div>
                        <div>
                          <p className="user-name">{u.name}</p>
                          <p className="user-id">ID: #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="user-email">{u.email}</p>
                      <p className="user-phone">{u.phone}</p>
                    </td>
                    <td><span className={`role-badge ${ROLE_CLASS[u.role]}`}>{u.role}</span></td>
                    <td><strong>{u.orders ?? 0}</strong> đơn</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td><span className={`badge ${STATUS_CLASS[u.status]}`}>{u.status}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => navigate(`/users/edit/${u.id}`)}>✏️</button>
                        <button
                          className={u.status === "Hoạt động" ? "btn-lock" : "btn-unlock"}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "Hoạt động" ? "Khoá tài khoản" : "Mở khoá"}
                        >{u.status === "Hoạt động" ? "🔒" : "🔓"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={`page-btn ${n === page ? "page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
