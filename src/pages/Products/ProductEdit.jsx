import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import "./ProductForm.css";

const CATEGORIES = ["Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Ban công"];

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    api.get(`/Products/${id}`)
      .then(res => setForm(res.data))
      .catch(() => setError("Không tìm thấy sản phẩm!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/Products/${id}`, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      navigate("/products");
    } catch {
      setError("Lỗi khi cập nhật sản phẩm! Kiểm tra lại backend.");
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
      <div className="form-error">⚠️ Không tìm thấy sản phẩm!</div>
      <button className="btn-back" onClick={() => navigate("/products")}>← Quay lại</button>
    </div>
  );

  return (
    <div className="product-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/products")}>← Quay lại</button>
        <h2>Sửa sản phẩm #{id}</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>

          <div className="form-section">
            <h3>Thông tin cơ bản</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="name">Tên sản phẩm *</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh mục *</label>
                <select id="category" name="category" value={form.category || ""} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Giá (₫) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="stock">Tồn kho *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={e => set("stock", e.target.value)}
                  required
                />
              </div>
              <div className="form-group full">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description || ""}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Hình ảnh & Cài đặt</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="image">URL hình ảnh</label>
                <input
                  id="image"
                  name="image"
                  value={form.image || ""}
                  onChange={e => set("image", e.target.value)}
                  placeholder="https://... hoặc /images/san-pham.jpg"
                />
                {form.image && (
                  <div className="img-preview">
                    <img src={form.image} alt="preview" onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
              <div className="form-group full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller || false}
                    onChange={e => set("isBestSeller", e.target.checked)}
                  />
                  <span>Đánh dấu là sản phẩm bán chạy</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/products")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
