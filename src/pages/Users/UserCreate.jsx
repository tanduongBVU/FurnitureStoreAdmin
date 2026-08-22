import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./UserForm.css";

// passwordHash: tên field khớp đúng property "PasswordHash" của model User bên backend
// để model binding hoạt động — nhưng giá trị nhập vào đây là mật khẩu THÔ, backend sẽ
// tự hash bằng BCrypt trước khi lưu (không lưu dạng thô).
const EMPTY_FORM = { name: "", email: "", phone: "", role: "Khách hàng", status: "Hoạt động", passwordHash: "" };

const UserCreate = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.passwordHash.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/Users", form);
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thêm người dùng! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/users")}>← Quay lại</button>
        <h2>Thêm người dùng mới</h2>
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
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="email@gmail.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Vai trò</label>
                <select id="role" value={form.role} onChange={e => set("role", e.target.value)}>
                  <option>Khách hàng</option>
                  <option>Nhân viên</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" value={form.status} onChange={e => set("status", e.target.value)}>
                  <option>Hoạt động</option>
                  <option>Bị khoá</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Mật khẩu * (tối thiểu 6 ký tự)</label>
                <input
                  id="password"
                  type="password"
                  value={form.passwordHash}
                  onChange={e => set("passwordHash", e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/users")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Thêm người dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;