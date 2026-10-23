import { useState, useEffect, useRef } from "react";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { updateStoredAdminUser } from "../../hooks/useAdminUser";
import { required, minLength, maxLength, phoneVN, sameAs, custom } from "../../utils/validators";
import "./Profile.css";

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập. Email KHÔNG sửa được ở trang này.
const RULES = {
  name: [
    required("Vui lòng nhập họ và tên."),
    minLength(2, "Họ tên cần ít nhất 2 ký tự."),
    maxLength(100, "Họ tên tối đa 100 ký tự."),
  ],
  phone: [phoneVN()],
  address: [maxLength(250, "Địa chỉ tối đa 250 ký tự.")],
};

// Luật cho form ĐỔI MẬT KHẨU (form riêng, tách khỏi form thông tin ở trên)
const PW_RULES = {
  currentPassword: [required("Vui lòng nhập mật khẩu hiện tại.")],
  newPassword: [
    required("Vui lòng nhập mật khẩu mới."),
    minLength(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
    custom((v, all) => (v && v === all?.currentPassword ? "Mật khẩu mới phải khác mật khẩu hiện tại." : "")),
  ],
  confirmPassword: [
    required("Vui lòng nhập lại mật khẩu mới."),
    sameAs("newPassword", "Mật khẩu nhập lại chưa khớp."),
  ],
};
const EMPTY_PW = { currentPassword: "", newPassword: "", confirmPassword: "" };

const getInitial = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] || "?";
  return last.charAt(0).toUpperCase();
};

const formatMonthYear = (d) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const Profile = () => {
  const [info, setInfo] = useState(null); // dữ liệu từ /Auth/me: email, role, avatarUrl, createdAt...
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const fileRef = useRef(null);
  const { errors, validateField, validateAll, clearError } = useFormValidation(RULES);

  // Đổi mật khẩu
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const pwV = useFormValidation(PW_RULES);

  useEffect(() => {
    api
      .get("/Auth/me")
      .then((res) => {
        setInfo(res.data);
        setForm({ name: res.data.name || "", phone: res.data.phone || "", address: res.data.address || "" });
      })
      .catch(() => setMsg({ type: "error", text: "Không thể tải thông tin tài khoản. Kiểm tra backend đang chạy chưa." }))
      .finally(() => setLoading(false));
  }, []);

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    clearError(f);
  };

  const setPwField = (f, v) => {
    setPw((p) => ({ ...p, [f]: v }));
    pwV.clearError(f);
    // Sửa mật khẩu mới/hiện tại thì các ô liên quan cần được kiểm tra lại
    if (f === "newPassword") pwV.clearError("confirmPassword");
    if (f === "currentPassword") pwV.clearError("newPassword");
    setPwMsg({ type: "", text: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!validateAll(form)) return;

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() };
      const res = await api.put("/Auth/me", payload);
      setInfo((p) => ({ ...p, ...res.data }));
      updateStoredAdminUser({ name: res.data.name });
      setMsg({ type: "success", text: "✓ Đã cập nhật thông tin cá nhân." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  };

  // Đổi mật khẩu của CHÍNH MÌNH — Backend bắt buộc nhập đúng mật khẩu hiện tại (PUT /Auth/change-password)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (!pwV.validateAll(pw)) return;

    setPwSaving(true);
    try {
      await api.put("/Auth/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw(EMPTY_PW);
      setPwMsg({ type: "success", text: "✓ Đã đổi mật khẩu thành công." });
    } catch (err) {
      const text = err.response?.data?.message || "Không thể đổi mật khẩu, vui lòng thử lại.";
      // Sai mật khẩu hiện tại → hiện ngay dưới ô đó; lỗi khác → banner phía trên form
      if (/hiện tại/i.test(text)) {
        pwV.setErrors((prev) => ({ ...prev, currentPassword: text }));
      } else {
        setPwMsg({ type: "error", text });
      }
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarMsg("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarMsg("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg("Ảnh vượt quá 2MB, vui lòng chọn ảnh nhẹ hơn.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const up = await api.post("/Upload", formData, { headers: { "Content-Type": undefined } });
      const res = await api.put("/Auth/me/avatar", { avatarUrl: up.data.url });
      setInfo((p) => ({ ...p, avatarUrl: res.data.avatarUrl }));
      updateStoredAdminUser({ avatarUrl: res.data.avatarUrl });
      setAvatarBroken(false);
    } catch (err) {
      setAvatarMsg(err.response?.data?.message || "Không thể cập nhật ảnh đại diện, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarMsg("");
    setUploading(true);
    try {
      await api.put("/Auth/me/avatar", { avatarUrl: "" });
      setInfo((p) => ({ ...p, avatarUrl: "" }));
      updateStoredAdminUser({ avatarUrl: "" });
    } catch (err) {
      setAvatarMsg(err.response?.data?.message || "Không thể xoá ảnh, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="profile-page">
        <div className="form-error">⚠️ {msg.text || "Không tìm thấy thông tin tài khoản."}</div>
      </div>
    );
  }

  const displayName = form.name || info.name || "Admin";

  return (
    <div className="profile-page">
      {/* ── Khối đầu: ảnh đại diện + tên + vai trò ── */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {info.avatarUrl && !avatarBroken ? (
              <img src={info.avatarUrl} alt="Ảnh đại diện" onError={() => setAvatarBroken(true)} />
            ) : (
              getInitial(displayName)
            )}
          </div>
        </div>
        <div className="profile-hero__text">
          <h2>{displayName}</h2>
          <p>
            <span className={`profile-role profile-role--${info.role === "Admin" ? "admin" : "staff"}`}>{info.role}</span>
            {info.createdAt && <span className="profile-since">Tham gia từ tháng {formatMonthYear(info.createdAt)}</span>}
          </p>
          <div className="profile-avatar-actions">
            <button type="button" className="profile-btn-light" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Đang cập nhật..." : "📷 Đổi ảnh đại diện"}
            </button>
            {info.avatarUrl && !uploading && (
              <button type="button" className="profile-link-btn" onClick={handleRemoveAvatar}>Xoá ảnh</button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarFile}
            />
          </div>
          {avatarMsg && <p className="profile-avatar-msg">{avatarMsg}</p>}
        </div>
      </div>

      {/* ── Form thông tin cá nhân ── */}
      <form className="profile-card" onSubmit={handleSave} noValidate>
        <h3>Thông tin cá nhân</h3>
        <p className="profile-card__sub">Bạn có thể sửa họ tên, số điện thoại và địa chỉ. Email không thể thay đổi tại đây. Mật khẩu đổi ở mục bên dưới.</p>

        {msg.text && <p className={`profile-msg profile-msg--${msg.type}`}>{msg.text}</p>}

        <div className="profile-grid">
          <div className="profile-field profile-field--full">
            <label>Email</label>
            <input type="email" value={info.email || ""} disabled />
            <span className="profile-hint">Email dùng để đăng nhập nên không thể thay đổi.</span>
          </div>

          <div className="profile-field">
            <label>Họ và tên *</label>
            <input
              type="text"
              name="name"
              className={errors.name ? "is-invalid" : ""}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => validateField("name", form)}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="profile-field">
            <label>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              className={errors.phone ? "is-invalid" : ""}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => validateField("phone", form)}
              placeholder="09xxxxxxxx"
            />
            <FieldError message={errors.phone} />
          </div>

          <div className="profile-field profile-field--full">
            <label>Địa chỉ</label>
            <textarea
              rows={2}
              name="address"
              className={errors.address ? "is-invalid" : ""}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              onBlur={() => validateField("address", form)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
            <FieldError message={errors.address} />
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="profile-btn-primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {/* ── Đổi mật khẩu — form riêng, lưu độc lập với form thông tin ở trên ── */}
      <form className="profile-card" onSubmit={handleChangePassword} noValidate>
        <h3>Đổi mật khẩu</h3>
        <p className="profile-card__sub">Nhập mật khẩu hiện tại để xác nhận, rồi chọn mật khẩu mới (tối thiểu 6 ký tự).</p>

        {pwMsg.text && <p className={`profile-msg profile-msg--${pwMsg.type}`}>{pwMsg.text}</p>}

        <div className="profile-grid">
          <div className="profile-field profile-field--full">
            <label>Mật khẩu hiện tại *</label>
            <input
              type="password"
              name="currentPassword"
              className={pwV.errors.currentPassword ? "is-invalid" : ""}
              value={pw.currentPassword}
              onChange={(e) => setPwField("currentPassword", e.target.value)}
              onBlur={() => pwV.validateField("currentPassword", pw)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <FieldError message={pwV.errors.currentPassword} />
          </div>

          <div className="profile-field">
            <label>Mật khẩu mới *</label>
            <input
              type="password"
              name="newPassword"
              className={pwV.errors.newPassword ? "is-invalid" : ""}
              value={pw.newPassword}
              onChange={(e) => setPwField("newPassword", e.target.value)}
              onBlur={() => pwV.validateField("newPassword", pw)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <FieldError message={pwV.errors.newPassword} />
          </div>

          <div className="profile-field">
            <label>Nhập lại mật khẩu mới *</label>
            <input
              type="password"
              name="confirmPassword"
              className={pwV.errors.confirmPassword ? "is-invalid" : ""}
              value={pw.confirmPassword}
              onChange={(e) => setPwField("confirmPassword", e.target.value)}
              onBlur={() => pwV.validateField("confirmPassword", pw)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <FieldError message={pwV.errors.confirmPassword} />
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="profile-btn-primary" disabled={pwSaving}>
            {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;