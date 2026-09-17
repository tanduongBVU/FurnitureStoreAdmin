import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import "./ProductForm.css";

const CATEGORIES = ["Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Ban công"];
const MATERIALS = ["Gỗ tự nhiên", "Gỗ công nghiệp", "Kim loại", "Vải nỉ", "Da/Da công nghiệp", "Mây tre đan", "Kính"];
const COLORS = ["Nâu gỗ", "Trắng", "Đen", "Xám", "Be/Kem", "Xanh dương", "Xanh lá", "Vàng"];

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    api.get(`/Products/${id}`)
      .then(res => {
        setForm({ discountPercent: 0, ...res.data });
        setVariants(
          (res.data.variants || []).map(v => ({
            id: v.id,
            material: v.material || MATERIALS[0],
            color: v.color || COLORS[0],
            price: String(v.price),
            stock: String(v.stock),
          }))
        );
      })
      .catch(() => setError("Không tìm thấy sản phẩm!"))
      .finally(() => setLoading(false));
  }, [id]);

  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const baseStock = Number(form?.stock) || 0;
  const stockExceeded = hasVariants && totalVariantStock > baseStock;

  const addVariantRow = () => setVariants(prev => [...prev, { material: MATERIALS[0], color: COLORS[0], price: "", stock: "" }]);
  const removeVariantRow = (idx) => setVariants(prev => prev.filter((_, i) => i !== idx));
  const setVariantField = (idx, field, value) =>
    setVariants(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (stockExceeded) {
      setError(`Tổng tồn kho các biến thể (${totalVariantStock}) không được vượt quá tồn kho tổng (${baseStock}).`);
      return;
    }

    setSaving(true);
    try {
      await api.put(`/Products/${id}`, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        discountPercent: Number(form.discountPercent) || 0,
        material: hasVariants ? null : form.material,
        color: hasVariants ? null : form.color,
        variants: variants.map(v => ({
          material: v.material,
          color: v.color,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
        })),
      });
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật sản phẩm! Kiểm tra lại backend.");
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

              {!hasVariants && (
                <>
                  <div className="form-group">
                    <label htmlFor="material">Chất liệu</label>
                    <select id="material" name="material" value={form.material || MATERIALS[0]} onChange={e => set("material", e.target.value)}>
                      {MATERIALS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="color">Màu sắc</label>
                    <select id="color" name="color" value={form.color || COLORS[0]} onChange={e => set("color", e.target.value)}>
                      {COLORS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

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
                {hasVariants && (
                  <span className="settings-field-hint">
                    Sản phẩm đang có biến thể — giá này KHÔNG dùng để bán, Client hiện giá của từng biến thể bên dưới.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="stock">Tồn kho tổng *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={e => set("stock", e.target.value)}
                  required
                />
                {hasVariants && (
                  <span className={`settings-field-hint ${stockExceeded ? "hint-error" : ""}`}>
                    Tổng tồn kho các biến thể: {totalVariantStock} / {baseStock || 0}
                    {stockExceeded && " — VƯỢT QUÁ giới hạn!"}
                  </span>
                )}
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
            <div className="variants-header">
              <h3 style={{ margin: 0 }}>Biến thể sản phẩm (không bắt buộc)</h3>
              <button type="button" className="btn-add-variant" onClick={addVariantRow}>+ Thêm biến thể</button>
            </div>
            <p className="settings-field-hint" style={{ marginBottom: 12 }}>
              Xoá hết các dòng bên dưới nếu muốn chuyển sản phẩm về bán 1 loại duy nhất (dùng lại Chất liệu/Màu/Giá/Tồn kho ở trên).
            </p>

            {variants.length === 0 ? (
              <p className="empty-note">Chưa có biến thể nào.</p>
            ) : (
              <div className="variant-rows">
                <div className="variant-row variant-row--header">
                  <span>Chất liệu</span>
                  <span>Màu sắc</span>
                  <span>Giá (₫)</span>
                  <span>Tồn kho</span>
                  <span></span>
                </div>
                {variants.map((v, idx) => (
                  <div className="variant-row" key={v.id ?? `new-${idx}`}>
                    <select value={v.material} onChange={e => setVariantField(idx, "material", e.target.value)}>
                      {MATERIALS.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select value={v.color} onChange={e => setVariantField(idx, "color", e.target.value)}>
                      {COLORS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="0"
                      value={v.price}
                      onChange={e => setVariantField(idx, "price", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="0"
                      value={v.stock}
                      onChange={e => setVariantField(idx, "stock", e.target.value)}
                    />
                    <button type="button" className="variant-row__remove" onClick={() => removeVariantRow(idx)}>✕</button>
                  </div>
                ))}
              </div>
            )}
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
                  value={form.discountPercent ?? 0}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 0 && v <= 100) set("discountPercent", e.target.value);
                  }}
                  placeholder="0 = không giảm giá"
                />
                <span className="settings-field-hint">Áp dụng cho MỌI biến thể (nếu có), tính trên giá của từng biến thể.</span>
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
            <button type="submit" className="btn-save" disabled={saving || stockExceeded}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductEdit;