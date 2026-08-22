import { useState, useEffect } from "react";
import api from "../../services/Api";
import "./Newsletter.css";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
  " " +
  new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const Newsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = () => {
    setLoading(true);
    api
      .get("/Newsletter/all")
      .then((res) => setSubscribers(res.data))
      .catch(() => setError("Không thể tải danh sách. Vui lòng thử lại sau."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá email này khỏi danh sách nhận tin?")) return;
    try {
      await api.delete(`/Newsletter/${id}`);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Xoá thất bại, vui lòng thử lại.");
    }
  };

  const handleCopyAll = () => {
    const emails = filtered.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails);
    alert(`Đã sao chép ${filtered.length} email vào clipboard!`);
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="newsletter-admin-page">
      <div className="newsletter-admin-header">
        <div>
          <h1>Đăng ký nhận tin</h1>
          <p>Danh sách email đã đăng ký nhận tin khuyến mãi từ Client.</p>
        </div>
        <div className="newsletter-admin-stats">
          <strong>{subscribers.length}</strong>
          <span>người đăng ký</span>
        </div>
      </div>

      <div className="newsletter-admin-toolbar">
        <input
          type="text"
          placeholder="Tìm theo email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleCopyAll} disabled={filtered.length === 0}>
          📋 Sao chép danh sách email
        </button>
      </div>

      {error && <div className="newsletter-admin-error">⚠️ {error}</div>}

      {loading ? (
        <p className="newsletter-admin-loading">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="newsletter-admin-empty">
          <span style={{ fontSize: 40 }}>✉️</span>
          <p>{search ? "Không tìm thấy email phù hợp." : "Chưa có ai đăng ký nhận tin."}</p>
        </div>
      ) : (
        <table className="newsletter-admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Ngày đăng ký</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => (
              <tr key={s.id}>
                <td>{idx + 1}</td>
                <td>{s.email}</td>
                <td>{formatDate(s.createdAt)}</td>
                <td>
                  <button className="newsletter-admin-delete" onClick={() => handleDelete(s.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Newsletter;