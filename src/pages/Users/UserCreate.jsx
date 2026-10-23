import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, email, phoneVN, minLength, maxLength } from "../../utils/validators";
import "./UserForm.css";

// passwordHash: tên field khớp đúng property "PasswordHash" của model User bên backend
// để model binding hoạt động — nhưng giá trị nhập vào đây là mật khẩu THÔ, backend sẽ
// tự hash bằng BCrypt trước khi lưu (không lưu dạng thô).
// Trang này CHỈ tạo tài khoản nội bộ (Nhân viên / Admin) — khách hàng tự đăng ký trên website.
const EMPTY_FORM = { name: "", email: "", phone: "", role: "Nhân viên", status: "Hoạt động", passwordHash: "" };

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập
const RULES = {
  name: [
    required("Vui lòng nhập họ và tên."),
    minLength(2, "Họ tên cần ít nhất 2 ký tự."),
    maxLength(100, "Họ tên tối đa 100 ký tự."),
  ],
  email: [required("Vui lòng nhập email."), email()],
  phone: [phoneVN()], // không bắt buộc, nhưng nếu nhập thì phải đúng định dạng
  passwordHash: [
    required("Vui lòng nhập mật khẩu."),
    minLength(6, "Mật khẩu phải có ít nhất 6 ký tự."),
  ],
};

const UserCreate = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { errors, validateField, validateAll, clearError, setErrors } = useFormValidation(RULES);

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    clearError(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll(form)) return;

    setSaving(true);
    try {
      await api.post("/Users", {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      navigate("/users");
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi thêm người dùng! Kiểm tra lại backend.";
      // Lỗi liên quan email (VD "Email đã được sử dụng!") → hiện ngay dưới ô email; lỗi khác → banner phía trên
      if (/email/i.test(msg)) {
        setErrors(prev => ({ ...prev, email: msg }));
        const el = document.querySelector('[name="email"]');
        if (el) el.focus();
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/users")}>← Quay lại</button>
        <h2>Thêm nhân viên / Admin</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <h3>Thông tin tài khoản</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Trang này chỉ tạo tài khoản nội bộ (Nhân viên / Admin). Khách hàng tự đăng ký tài khoản trên website.
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Họ và tên *</label>
                <input
                  id="name"
                  name="name"
                  className={errors.name ? "is-invalid" : ""}
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  onBlur={() => validateField("name", form)}
                  placeholder="VD: Nguyễn Văn A"
                />
                <FieldError message={errors.name} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={errors.email ? "is-invalid" : ""}
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  onBlur={() => validateField("email", form)}
                  placeholder="email@gmail.com"
                />
                <FieldError message={errors.email} />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  className={errors.phone ? "is-invalid" : ""}
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  onBlur={() => validateField("phone", form)}
                  placeholder="09xxxxxxxx"
                />
                <FieldError message={errors.phone} />
              </div>
              <div className="form-group">
                <label htmlFor="role">Vai trò</label>
                <select id="role" value={form.role} onChange={e => set("role", e.target.value)}>
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
                  name="passwordHash"
                  type="password"
                  className={errors.passwordHash ? "is-invalid" : ""}
                  value={form.passwordHash}
                  onChange={e => set("passwordHash", e.target.value)}
                  onBlur={() => validateField("passwordHash", form)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <FieldError message={errors.passwordHash} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/users")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Thêm tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;