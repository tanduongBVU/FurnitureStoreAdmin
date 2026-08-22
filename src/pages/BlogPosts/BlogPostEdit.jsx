import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import api from "../../services/Api";
import "../Products/ProductForm.css";

const CATEGORIES = ["Mẹo trang trí", "Bảo quản gỗ", "Xu hướng nội thất", "Câu chuyện thương hiệu"];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link", "image"],
    ["clean"],
  ],
};

const BlogPostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    api.get(`/BlogPosts/${id}`)
      .then(res => setForm(res.data))
      .catch(() => setError("Không tìm thấy bài viết!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/BlogPosts/${id}`, form);
      navigate("/blogposts");
    } catch {
      setError("Lỗi khi cập nhật bài viết! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="product-form-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
    </div>
  );

  if (!form) return (
    <div className="product-form-page">
      <div className="form-error">⚠️ Không tìm thấy bài viết!</div>
      <button className="btn-back" onClick={() => navigate("/blogposts")}>← Quay lại</button>
    </div>
  );

  return (
    <div className="product-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/blogposts")}>← Quay lại</button>
        <h2>Sửa bài viết #{id}</h2>
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
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Chủ đề *</label>
                <select id="category" value={form.category || ""} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="author">Tác giả</label>
                <input
                  id="author"
                  value={form.author || ""}
                  onChange={e => set("author", e.target.value)}
                />
              </div>
              <div className="form-group full">
                <label htmlFor="excerpt">Tóm tắt ngắn *</label>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={form.excerpt || ""}
                  onChange={e => set("excerpt", e.target.value)}
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
                  value={form.thumbnail || ""}
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
              value={form.content || ""}
              onChange={v => set("content", v)}
              modules={QUILL_MODULES}
            />
          </div>

          <div className="form-section">
            <h3>Cài đặt</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isPublished || false}
                    onChange={e => set("isPublished", e.target.checked)}
                  />
                  <span>Đăng công khai (bỏ chọn = chuyển về nháp)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/blogposts")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BlogPostEdit;
