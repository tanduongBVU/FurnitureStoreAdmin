import { useState, useEffect } from "react";
import api from "../../services/Api";
import "./Projects.css";

const emptyForm = {
  title: "",
  coverImage: "",
  imagesText: "", // textarea nhập mỗi dòng 1 URL, tự nối thành chuỗi phân tách dấu phẩy khi lưu
  location: "",
  category: "",
  year: "",
  shortDescription: "",
  content: "",
  displayOrder: 0,
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get("/Projects/all")
      .then((res) => setProjects(res.data))
      .catch(() => setError("Không thể tải danh sách dự án."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    // Images lưu trong DB dạng "url1,url2,url3" — tách ra hiện mỗi dòng 1 URL cho dễ đọc/sửa
    const imagesText = (p.images || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
      .join("\n");

    setForm({
      title: p.title,
      coverImage: p.coverImage || "",
      imagesText,
      location: p.location || "",
      category: p.category || "",
      year: p.year || "",
      shortDescription: p.shortDescription || "",
      content: p.content || "",
      displayOrder: p.displayOrder ?? 0,
    });
    setEditingId(p.id);
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

    // Tách textarea (mỗi dòng 1 URL) thành chuỗi phân tách dấu phẩy để lưu đúng định dạng
    // mà Project.cs (Backend) và ProjectDetail.jsx (Client) đang mong đợi.
    const images = form.imagesText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .join(",");

    const payload = {
      title: form.title.trim(),
      coverImage: form.coverImage.trim(),
      images,
      location: form.location.trim(),
      category: form.category.trim(),
      year: form.year.trim(),
      shortDescription: form.shortDescription.trim(),
      content: form.content,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (!payload.title) {
      setFormError("Tên dự án không được để trống.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/Projects/${editingId}`, { id: editingId, ...payload, isActive: true });
      } else {
        await api.post("/Projects", payload);
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p) => {
    try {
      if (p.isActive) {
        await api.delete(`/Projects/${p.id}`);
      } else {
        await api.patch(`/Projects/${p.id}/restore`);
      }
      fetchData();
    } catch {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <div className="projects-admin-page">
      <div className="projects-admin-header">
        <div>
          <h1>Dự án kiến trúc</h1>
          <p>Quản lý portfolio các dự án hiển thị ở Client (mục Dịch vụ → Dự án kiến trúc).</p>
        </div>
        <button className="projects-admin-create-btn" onClick={openCreate}>
          + Thêm dự án
        </button>
      </div>

      {error && <div className="projects-admin-error">⚠️ {error}</div>}

      {loading ? (
        <p className="projects-admin-loading">Đang tải...</p>
      ) : projects.length === 0 ? (
        <div className="projects-admin-empty">
          <span style={{ fontSize: 40 }}>🏛️</span>
          <p>Chưa có dự án nào.</p>
        </div>
      ) : (
        <div className="projects-admin-grid">
          {projects.map((p) => (
            <div className={`projects-admin-card ${!p.isActive ? "projects-admin-card--hidden" : ""}`} key={p.id}>
              <div className="projects-admin-card__img">
                {p.coverImage ? <img src={p.coverImage} alt={p.title} /> : <span>🏛️</span>}
                {p.category && <span className="projects-admin-card__tag">{p.category}</span>}
              </div>
              <div className="projects-admin-card__body">
                <h3>{p.title}</h3>
                <p className="projects-admin-card__meta">
                  {p.location && <span>📍 {p.location}</span>}
                  {p.year && <span>📅 {p.year}</span>}
                </p>
                <div className="projects-admin-card__actions">
                  <button onClick={() => openEdit(p)}>✏️ Sửa</button>
                  <button onClick={() => handleToggleActive(p)}>
                    {p.isActive ? "🙈 Ẩn" : "👁️ Hiện lại"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="projects-admin-modal-overlay" onClick={closeForm}>
          <div className="projects-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Sửa dự án" : "Thêm dự án mới"}</h2>
            <form onSubmit={handleSubmit}>
              {formError && <p className="projects-admin-modal-error">⚠️ {formError}</p>}

              <div className="projects-admin-field">
                <label>Tên dự án *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                />
              </div>

              <div className="projects-admin-row">
                <div className="projects-admin-field">
                  <label>Danh mục (VD: Nhà phố, Biệt thự)</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                  />
                </div>
                <div className="projects-admin-field">
                  <label>Năm thực hiện</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => setField("year", e.target.value)}
                    placeholder="2025"
                  />
                </div>
              </div>

              <div className="projects-admin-field">
                <label>Địa điểm</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="VD: Quận 2, TP.HCM"
                />
              </div>

              <div className="projects-admin-field">
                <label>URL ảnh đại diện (cover)</label>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setField("coverImage", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="projects-admin-field">
                <label>Ảnh chi tiết (mỗi dòng 1 URL)</label>
                <textarea
                  rows={4}
                  value={form.imagesText}
                  onChange={(e) => setField("imagesText", e.target.value)}
                  placeholder={"https://anh1.jpg\nhttps://anh2.jpg\nhttps://anh3.jpg"}
                />
                <span className="projects-admin-field-hint">
                  Dán mỗi URL ảnh trên 1 dòng riêng. Đây là các ảnh hiện trong gallery khi khách xem chi tiết dự án.
                </span>
              </div>

              <div className="projects-admin-field">
                <label>Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                />
              </div>

              <div className="projects-admin-field">
                <label>Nội dung chi tiết (HTML)</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder="<p>Nội dung chi tiết...</p>"
                />
              </div>

              <div className="projects-admin-field">
                <label>Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setField("displayOrder", e.target.value)}
                />
              </div>

              <div className="projects-admin-modal-actions">
                <button type="button" className="projects-admin-cancel" onClick={closeForm}>Huỷ</button>
                <button type="submit" className="projects-admin-save" disabled={saving}>
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm dự án"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;