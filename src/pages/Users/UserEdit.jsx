import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./UserForm.css";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    api.get(`/Users/${id}`)
      .then(res => setForm(res.data))
      .catch(() => setError("Không tìm thấy người dùng!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/Users/${id}`, form);
      navigate("/users");
    } catch {
      setError("Lỗi khi cập nhật người dùng! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="user-form-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
    </div>
  );

  if (!form) return (
    <div className="user-form-page">
      <div className="form-error">⚠️ Không tìm thấy người dùng!</div>
      <button className="btn-back" onClick={() => navigate("/users")}>← Quay lại</button>
    </div>
  );

  return (
    <div className="user-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/users")}>← Quay lại</button>
        <h2>Sửa người dùng #{id}</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Thông tin người dùng</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Họ và tên *</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={form.email} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  value={form.phone || ""}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Vai trò</label>
                <select id="role" value={form.role || ""} onChange={e => set("role", e.target.value)}>
                  <option>Khách hàng</option>
                  <option>Nhân viên</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" value={form.status || ""} onChange={e => set("status", e.target.value)}>
                  <option>Hoạt động</option>
                  <option>Bị khoá</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/users")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;
