import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./Contacts.css";

const STATUS_LIST = ["Tất cả", "Mới", "Đang xử lý", "Đã xử lý"];
const STATUS_CLASS = {
  "Mới":        "badge--danger",
  "Đang xử lý": "badge--warning",
  "Đã xử lý":   "badge--success",
};
const PAGE_SIZE = 6;

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage]             = useState(1);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Contacts");
      setContacts(res.data);
    } catch {
      setError("Không thể tải danh sách liên hệ. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const filtered = contacts.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.email?.toLowerCase().includes(search.toLowerCase()) ||
                        c.phone?.includes(search);
    const matchStatus = statusFilter === "Tất cả" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="contacts-page">

      {/* Stats */}
      <div className="contact-stats">
        {["Mới", "Đang xử lý", "Đã xử lý"].map(s => (
          <div className="contact-stat" key={s}>
            <span className={`badge ${STATUS_CLASS[s]}`}>{s}</span>
            <strong>{contacts.filter(c => c.status === s).length}</strong>
          </div>
        ))}
        <div className="contact-stat">
          <span className="badge badge--info">Tổng</span>
          <strong>{contacts.length}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="contacts-toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input placeholder="Tìm tên, email, số điện thoại..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="filter-tabs">
          {STATUS_LIST.map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-box">⚠️ {error} <button onClick={fetchContacts}>Thử lại</button></div>}

      {/* Loading */}
      {loading ? (
        <div className="loading-box"><div className="spinner" /><p>Đang tải liên hệ...</p></div>
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Khách hàng</th><th>Nội dung</th>
                  <th>Ngày gửi</th><th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">Không tìm thấy liên hệ nào</td></tr>
                ) : paginated.map(c => (
                  <tr key={c.id} className={c.status === "Mới" ? "row--new" : ""}>
                    <td><strong>#{c.id}</strong></td>
                    <td>
                      <p className="cust-name">{c.name}</p>
                      <p className="cust-sub">{c.phone}</p>
                      <p className="cust-sub">{c.email}</p>
                    </td>
                    <td className="msg-col">{c.message}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span></td>
                    <td className="note-col">{c.note || <span className="no-note">Chưa có</span>}</td>
                    <td><button className="btn-view" onClick={() => navigate(`/contacts/${c.id}`)}>👁️ Xem</button></td>
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

export default Contacts;
