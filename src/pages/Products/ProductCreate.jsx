import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./ProductForm.css";

const CATEGORIES = ["Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Ban công"];
const MATERIALS = ["Gỗ tự nhiên", "Gỗ công nghiệp", "Kim loại", "Vải nỉ", "Da/Da công nghiệp", "Mây tre đan", "Kính"];
const COLORS = ["Nâu gỗ", "Trắng", "Đen", "Xám", "Be/Kem", "Xanh dương", "Xanh lá", "Vàng"];
const EMPTY_FORM = {
  name: "", category: "Phòng khách", price: "", stock: "", description: "", image: "",
  isBestSeller: false, discountPercent: 0,
  material: MATERIALS[0], color: COLORS[0],
};

const ProductCreate = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/Products", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        discountPercent: Number(form.discountPercent) || 0,
      });
      navigate("/products");
    } catch {
      setError("Lỗi khi thêm sản phẩm! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/products")}>← Quay lại</button>
        <h2>Thêm sản phẩm mới</h2>
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
                  placeholder="VD: Sofa Bắc Âu Oslo"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh mục *</label>
                <select id="category" name="category" value={form.category} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="material">Chất liệu</label>
                <select id="material" name="material" value={form.material} onChange={e => set("material", e.target.value)}>
                  {MATERIALS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="color">Màu sắc</label>
                <select id="color" name="color" value={form.color} onChange={e => set("color", e.target.value)}>
                  {COLORS.map(c => <option key={c}>{c}</option>)}
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
                  placeholder="VD: 18500000"
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
                  placeholder="VD: 10"
                  required
                />
              </div>
              <div className="form-group full">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Khuyến mãi</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="discountPercent">Giảm giá (%)</label>
                <input
                  id="discountPercent"
                  name="discountPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPercent}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 0 && v <= 100) set("discountPercent", e.target.value);
                  }}
                  placeholder="0 = không giảm giá"
                />
              </div>
              {Number(form.discountPercent) > 0 && Number(form.price) > 0 && (
                <div className="form-group" style={{ justifyContent: "flex-end" }}>
                  <label>Giá sau giảm</label>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <strong style={{ color: "#b91c1c", fontSize: 16 }}>
                      {formatPrice(Number(form.price) * (1 - Number(form.discountPercent) / 100))}
                    </strong>
                    <span style={{ textDecoration: "line-through", color: "#999", fontSize: 13 }}>
                      {formatPrice(form.price)}
                    </span>
                  </div>
                </div>
              )}
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
                  value={form.image}
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
                    checked={form.isBestSeller}
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
              {saving ? "Đang lưu..." : "Thêm sản phẩm"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductCreate;