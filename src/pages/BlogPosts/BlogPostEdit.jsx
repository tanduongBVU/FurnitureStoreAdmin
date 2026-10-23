import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import api from "../../services/Api";
import ImageUploadInput from "../../components/ImageUploadInput/ImageUploadInput";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, minLength, maxLength, imagePath } from "../../utils/validators";
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

// Nội dung ReactQuill rỗng vẫn trả về "<p><br></p>" nên phải bóc thẻ HTML ra mới biết thật sự có chữ hay không
// (có ảnh hoặc video chèn trong bài cũng tính là có nội dung).
const hasRichText = (html) => {
  const s = String(html || "");
  const text = s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length > 0 || /<img|<iframe/i.test(s);
};
const richTextRequired = (msg) => (v) => (hasRichText(v) ? "" : msg);

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập
const RULES = {
  title: [
    required("Vui lòng nhập tiêu đề bài viết."),
    minLength(5, "Tiêu đề cần ít nhất 5 ký tự."),
    maxLength(200, "Tiêu đề tối đa 200 ký tự."),
  ],
  author: [maxLength(100, "Tên tác giả tối đa 100 ký tự.")],
  excerpt: [
    required("Vui lòng nhập tóm tắt ngắn."),
    minLength(10, "Tóm tắt quá ngắn, hãy viết ít nhất 10 ký tự."),
    maxLength(500, "Tóm tắt tối đa 500 ký tự."),
  ],
  thumbnail: [imagePath()],
  content: [richTextRequired("Vui lòng nhập nội dung bài viết.")],
};

const BlogPostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { errors, validateField, validateAll, clearError } = useFormValidation(RULES);

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    clearError(f);
  };

  useEffect(() => {
    api.get(`/BlogPosts/${id}`)
      .then(res => setForm(res.data))
      .catch(() => setError("Không tìm thấy bài viết!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll(form)) return;

    setSaving(true);
    try {
      await api.put(`/BlogPosts/${id}`, { ...form, title: form.title.trim(), excerpt: (form.excerpt || "").trim() });
      navigate("/blogposts");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật bài viết! Kiểm tra lại backend.");
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
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-section">
            <h3>Thông tin bài viết</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="title">Tiêu đề *</label>
                <input
                  id="title"
                  name="title"
                  className={errors.title ? "is-invalid" : ""}
                  value={form.title || ""}
                  onChange={e => set("title", e.target.value)}
                  onBlur={() => validateField("title", form)}
                />
                <FieldError message={errors.title} />
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
                  name="author"
                  className={errors.author ? "is-invalid" : ""}
                  value={form.author || ""}
                  onChange={e => set("author", e.target.value)}
                  onBlur={() => validateField("author", form)}
                />
                <FieldError message={errors.author} />
              </div>
              <div className="form-group full">
                <label htmlFor="excerpt">Tóm tắt ngắn *</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  className={errors.excerpt ? "is-invalid" : ""}
                  value={form.excerpt || ""}
                  onChange={e => set("excerpt", e.target.value)}
                  onBlur={() => validateField("excerpt", form)}
                />
                <FieldError message={errors.excerpt} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Ảnh đại diện</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>URL ảnh đại diện</label>
                <ImageUploadInput
                  value={form.thumbnail || ""}
                  onChange={url => set("thumbnail", url)}
                  placeholder="https://... , /images/bai-viet.jpg hoặc tải lên từ máy →"
                  showPreview={false}
                />
                <FieldError message={errors.thumbnail} />
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
            <FieldError message={errors.content} />
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