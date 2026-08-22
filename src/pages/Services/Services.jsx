import { useState, useEffect } from "react";
import api from "../../services/Api";
import "./Services.css";

const TYPE_LABELS = {
  "thi-cong": "Dịch vụ thi công",
  "thiet-ke": "Dịch vụ thiết kế",
};

const emptyForm = {
  type: "thi-cong",
  title: "",
  image: "",
  shortDescription: "",
  content: "",
  displayOrder: 0,
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get("/Services/all")
      .then((res) => setServices(res.data))
      .catch(() => setError("Không thể tải danh sách dịch vụ."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setForm({ ...emptyForm, type: filterType !== "all" ? filterType : "thi-cong" });
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      type: s.type,
      title: s.title,
      image: s.image || "",
      shortDescription: s.shortDescription || "",
      content: s.content || "",
      displayOrder: s.displayOrder ?? 0,
    });
    setEditingId(s.id);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const payload = {
      type: form.type,
      title: form.title.trim(),
      image: form.image.trim(),
      shortDescription: form.shortDescription.trim(),
      content: form.content,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (!payload.title) {
      setFormError("Tên dịch vụ không được để trống.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/Services/${editingId}`, { id: editingId, ...payload, isActive: true });
      } else {
        await api.post("/Services", payload);
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s) => {
    try {
      if (s.isActive) {
        await api.delete(`/Services/${s.id}`);
      } else {
        await api.patch(`/Services/${s.id}/restore`);
      }
      fetchData();
    } catch {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const filtered = filterType === "all" ? services : services.filter((s) => s.type === filterType);

  return (
    <div className="services-admin-page">
      <div className="services-admin-header">
        <div>
          <h1>Dịch vụ</h1>
          <p>Quản lý nội dung Dịch vụ thi công & Dịch vụ thiết kế hiển thị ở Client.</p>
        </div>
        <button className="services-admin-create-btn" onClick={openCreate}>
          + Thêm dịch vụ
        </button>
      </div>

      <div className="services-admin-filter">
        {["all", "thi-cong", "thiet-ke"].map((t) => (
          <button
            key={t}
            className={`services-filter-btn ${filterType === t ? "services-filter-btn--active" : ""}`}
            onClick={() => setFilterType(t)}
          >
            {t === "all" ? "Tất cả" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <div className="services-admin-error">⚠️ {error}</div>}

      {loading ? (
        <p className="services-admin-loading">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="services-admin-empty">
          <span style={{ fontSize: 40 }}>🛠️</span>
          <p>Chưa có dịch vụ nào trong mục này.</p>
        </div>
      ) : (
        <div className="services-admin-grid">
          {filtered.map((s) => (
            <div className={`services-admin-card ${!s.isActive ? "services-admin-card--hidden" : ""}`} key={s.id}>
              <div className="services-admin-card__img">
                {s.image ? <img src={s.image} alt={s.title} /> : <span>🛠️</span>}
              </div>
              <div className="services-admin-card__body">
                <span className="services-admin-card__type">{TYPE_LABELS[s.type] || s.type}</span>
                <h3>{s.title}</h3>
                <p>{s.shortDescription}</p>
                <div className="services-admin-card__actions">
                  <button onClick={() => openEdit(s)}>✏️ Sửa</button>
                  <button onClick={() => handleToggleActive(s)}>
                    {s.isActive ? "🙈 Ẩn" : "👁️ Hiện lại"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="services-admin-modal-overlay" onClick={closeForm}>
          <div className="services-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h2>
            <form onSubmit={handleSubmit}>
              {formError && <p className="services-admin-modal-error">⚠️ {formError}</p>}

              <div className="services-admin-field">
                <label>Loại dịch vụ *</label>
                <select value={form.type} onChange={(e) => setField("type", e.target.value)}>
                  <option value="thi-cong">Dịch vụ thi công</option>
                  <option value="thiet-ke">Dịch vụ thiết kế</option>
                </select>
              </div>

              <div className="services-admin-field">
                <label>Tên dịch vụ *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                />
              </div>

              <div className="services-admin-field">
                <label>URL ảnh</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setField("image", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="services-admin-field">
                <label>Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                />
              </div>

              <div className="services-admin-field">
                <label>Nội dung chi tiết (HTML)</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder="<p>Nội dung chi tiết...</p>"
                />
              </div>

              <div className="services-admin-field">
                <label>Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setField("displayOrder", e.target.value)}
                />
              </div>

              <div className="services-admin-modal-actions">
                <button type="button" className="services-admin-cancel" onClick={closeForm}>Huỷ</button>
                <button type="submit" className="services-admin-save" disabled={saving}>
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;