import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, phoneVN, minLength, maxLength } from "../../utils/validators";
import "./UserForm.css";

// Luật kiểm tra — lỗi hiện chữ đỏ ngay dưới ô nhập
const MAIN_RULES = {
  name: [
    required("Vui lòng nhập họ và tên."),
    minLength(2, "Họ tên cần ít nhất 2 ký tự."),
    maxLength(100, "Họ tên tối đa 100 ký tự."),
  ],
  phone: [phoneVN()], // không bắt buộc, nhưng nếu nhập thì phải đúng định dạng
};
const RESET_RULES = {
  newPassword: [
    required("Vui lòng nhập mật khẩu mới."),
    minLength(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
  ],
};

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  // Tài khoản KHÁCH HÀNG: chỉ xem. Admin không được sửa thông tin khách (khách tự quản lý);
  // chỉ khoá/mở khoá (ở danh sách) và đặt lại mật khẩu (ở dưới). Chặn thật nằm ở Backend.
  const [isCustomer, setIsCustomer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mainV = useFormValidation(MAIN_RULES);
  const resetV = useFormValidation(RESET_RULES);

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    mainV.clearError(f);
  };

  // Đặt lại mật khẩu — tách riêng khỏi form thông tin chính vì đây là hành động nhạy cảm
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    api.get(`/Users/${id}`)
      .then(res => {
        setForm(res.data);
        setIsCustomer(res.data.role === "Khách hàng");
      })
      .catch(() => setError("Không tìm thấy người dùng!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCustomer) return; // không bao giờ gửi cập nhật cho tài khoản khách hàng
    setError("");
    if (!mainV.validateAll(form)) return;

    setSaving(true);
    try {
      await api.put(`/Users/${id}`, { ...form, name: form.name.trim(), phone: (form.phone || "").trim() });
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật người dùng! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isCustomer) return; // Admin không được đặt lại mật khẩu của khách hàng
    setResetError("");
    setResetSuccess(false);
    if (!resetV.validateAll({ newPassword })) return;

    setResetting(true);
    try {
      await api.patch(`/Users/${id}/reset-password`, JSON.stringify(newPassword), {
        headers: { "Content-Type": "application/json" },
      });
      setResetSuccess(true);
      setNewPassword("");
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      setResetError(err.response?.data?.message || "Lỗi khi đặt lại mật khẩu! Kiểm tra lại backend.");
    } finally {
      setResetting(false);
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
        <h2>{isCustomer ? `Thông tin khách hàng #${id}` : `Sửa người dùng #${id}`}</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      {isCustomer && (
        <div
          style={{
            background: "rgba(79,114,227,.08)", border: "1px solid rgba(79,114,227,.25)",
            borderRadius: 10, padding: "12px 16px", color: "#334155", fontSize: 14, marginBottom: 16, lineHeight: 1.5,
          }}
        >
          ℹ️ Khách hàng tự đăng ký và tự quản lý thông tin cá nhân nên Admin <strong>không được sửa</strong>.
          Admin chỉ có thể xem và khoá/mở khoá tài khoản (ở danh sách người dùng). Mật khẩu cũng do khách tự đặt lại,
          Admin không được can thiệp.
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <h3>Thông tin người dùng</h3>
            {/* fieldset disabled: khoá toàn bộ ô nhập bên trong khi xem tài khoản khách hàng */}
            <fieldset disabled={isCustomer} style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Họ và tên{isCustomer ? "" : " *"}</label>
                  <input
                    id="name"
                    name="name"
                    className={mainV.errors.name ? "is-invalid" : ""}
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    onBlur={() => mainV.validateField("name", form)}
                  />
                  <FieldError message={mainV.errors.name} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={form.email} disabled />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    id="phone"
                    name="phone"
                    className={mainV.errors.phone ? "is-invalid" : ""}
                    value={form.phone || ""}
                    onChange={e => set("phone", e.target.value)}
                    onBlur={() => mainV.validateField("phone", form)}
                    placeholder={isCustomer ? "" : "09xxxxxxxx"}
                  />
                  <FieldError message={mainV.errors.phone} />
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
            </fieldset>
          </div>

          <div className="form-actions">
            {isCustomer ? (
              <button type="button" className="btn-cancel" onClick={() => navigate("/users")}>← Quay lại danh sách</button>
            ) : (
              <>
                <button type="button" className="btn-cancel" onClick={() => navigate("/users")}>Huỷ</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Đặt lại mật khẩu — chỉ cho tài khoản NỘI BỘ; ẩn hoàn toàn với khách hàng */}
      {!isCustomer && (
      <div className="form-card">
        <form onSubmit={handleResetPassword} noValidate>
          <div className="form-section">
            <h3>Đặt lại mật khẩu</h3>
            {resetError && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {resetError}</div>}
            {resetSuccess && (
              <div
                style={{
                  background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)",
                  borderRadius: 10, padding: "12px 16px", color: "#16a34a", fontSize: 14, marginBottom: 16,
                }}
              >
                ✓ Đã đặt lại mật khẩu thành công!
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="newPassword">Mật khẩu mới * (tối thiểu 6 ký tự)</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className={resetV.errors.newPassword ? "is-invalid" : ""}
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    resetV.clearError("newPassword");
                  }}
                  onBlur={() => resetV.validateField("newPassword", { newPassword })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <FieldError message={resetV.errors.newPassword} />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={resetting}>
              {resetting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
};

export default UserEdit;