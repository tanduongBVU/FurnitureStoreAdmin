import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
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
    try {
      const res = await api.post("/Auth/login", form);
      const { token, id, name, email, role } = res.data;

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
      </div>
    </div>
  );
};

export default Login;
