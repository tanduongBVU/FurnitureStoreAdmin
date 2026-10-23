import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, email } from "../../utils/validators";
import "./Login.css";

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập
const RULES = {
  email: [required("Vui lòng nhập email."), email()],
  password: [required("Vui lòng nhập mật khẩu.")],
};

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { errors, validateField, validateAll, clearError } = useFormValidation(RULES);

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    clearError(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll(form)) return;

    setLoading(true);
    try {
      const res = await api.post("/Auth/login", { email: form.email.trim(), password: form.password });
      const { token, id, name, email, role } = res.data;

      // Chỉ Admin / Nhân viên được vào trang quản trị — chặn ngay, KHÔNG lưu token cho tài khoản khách hàng
      if (role !== "Admin" && role !== "Nhân viên") {
        setError("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify({ id, name, email, role }));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Email hoặc mật khẩu không đúng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⬡</span>
          <span className="login-logo-text">LuxWood</span>
          <span className="login-logo-sub">Admin Panel</span>
        </div>
        <h2>Đăng nhập</h2>
        <p className="login-desc">Vui lòng đăng nhập để tiếp tục quản trị</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@luxwood.vn"
              className={errors.email ? "is-invalid" : ""}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => validateField("email", form)}
              autoComplete="email"
            />
            <FieldError message={errors.email} />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className={errors.password ? "is-invalid" : ""}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => validateField("password", form)}
              autoComplete="current-password"
            />
            <FieldError message={errors.password} />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;