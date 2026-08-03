import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Tạm thời giả lập login — thay bằng API sau
    setTimeout(() => {
      if (form.email === "admin@luxwood.vn" && form.password === "admin123") {
        localStorage.setItem("adminToken", "fake-token-123");
        navigate("/dashboard");
      } else {
        setError("Email hoặc mật khẩu không đúng!");
      }
      setLoading(false);
    }, 800);
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
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@luxwood.vn"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="login-hint">Demo: admin@luxwood.vn / admin123</p>
      </div>
    </div>
  );
};

export default Login;
