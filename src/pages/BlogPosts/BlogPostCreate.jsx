import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import api from "../../services/Api";
import "../Products/ProductForm.css";

const CATEGORIES = ["Mẹo trang trí", "Bảo quản gỗ", "Xu hướng nội thất", "Câu chuyện thương hiệu"];
const EMPTY_FORM = {
  title: "", category: "Mẹo trang trí", thumbnail: "", excerpt: "",
  content: "", author: "LuxWood", isPublished: true,
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link", "image"],
    ["clean"],
  ],
};

const BlogPostCreate = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/BlogPosts", form);
      navigate("/blogposts");
    } catch {
      setError("Lỗi khi đăng bài viết! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/blogposts")}>← Quay lại</button>
        <h2>Viết bài mới</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>

          <div className="form-section">
            <h3>Thông tin bài viết</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="title">Tiêu đề *</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="VD: 5 mẹo bảo quản đồ gỗ trong mùa mưa"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Chủ đề *</label>
                <select id="category" value={form.category} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="author">Tác giả</label>
                <input
                  id="author"
                  value={form.author}
                  onChange={e => set("author", e.target.value)}
                  placeholder="LuxWood"
                />
              </div>
              <div className="form-group full">
                <label htmlFor="excerpt">Tóm tắt ngắn *</label>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={form.excerpt}
                  onChange={e => set("excerpt", e.target.value)}
                  placeholder="1-2 câu tóm tắt, hiện ở trang danh sách..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Ảnh đại diện</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="thumbnail">URL ảnh đại diện</label>
                <input
                  id="thumbnail"
                  value={form.thumbnail}
                  onChange={e => set("thumbnail", e.target.value)}
                  placeholder="https://... hoặc /images/bai-viet.jpg"
                />
                {form.thumbnail && (
                  <div className="img-preview">
                    <img src={form.thumbnail} alt="preview" onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Nội dung bài viết *</h3>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={v => set("content", v)}
              modules={QUILL_MODULES}
              placeholder="Viết nội dung bài viết tại đây..."
            />
          </div>

          <div className="form-section">
            <h3>Cài đặt</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={e => set("isPublished", e.target.checked)}
                  />
                  <span>Đăng công khai ngay (bỏ chọn = lưu nháp)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/blogposts")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Đăng bài viết"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BlogPostCreate;
