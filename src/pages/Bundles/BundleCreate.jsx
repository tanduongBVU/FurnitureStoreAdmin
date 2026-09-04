import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./BundleForm.css";

const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

const BundleCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", image: "", discountPercent: 0 });
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState([]); // [{ productId, name, image, unitPrice, quantity }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  // Lấy TOÀN BỘ sản phẩm (kể cả không phải bán chạy) từ endpoint Admin — cần đủ danh sách
  // để chọn vào combo, khác với Client chỉ thấy sản phẩm IsActive qua endpoint công khai.
  useEffect(() => {
    api.get("/Products/all")
      .then(res => setAllProducts(res.data.filter(p => p.isActive)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedIds = selected.map(s => s.productId);
  const searchResults = productSearch.trim().length < 1
    ? []
    : allProducts
        .filter(p => !selectedIds.includes(p.id) && p.name.toLowerCase().includes(productSearch.toLowerCase()))
        .slice(0, 8);

  const addProduct = (p) => {
    const unitPrice = p.price * (1 - (p.discountPercent || 0) / 100);
    setSelected(prev => [...prev, { productId: p.id, name: p.name, image: p.image, unitPrice, quantity: 1 }]);
    setProductSearch("");
  };

  const removeProduct = (productId) => setSelected(prev => prev.filter(s => s.productId !== productId));

  const setQuantity = (productId, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setSelected(prev => prev.map(s => (s.productId === productId ? { ...s, quantity: q } : s)));
  };

  // Xem trước giá NGAY TRÊN FORM — dùng đúng công thức Backend sẽ tính (subtotal → áp %
  // giảm của combo), để Admin thấy giá cuối cùng khách sẽ thấy trước khi lưu.
  const subtotal = selected.reduce((s, item) => s + item.unitPrice * item.quantity, 0);
  const finalPrice = Math.round(subtotal * (1 - (Number(form.discountPercent) || 0) / 100));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length < 2) {
      setError("Combo cần chọn ít nhất 2 sản phẩm.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/Bundles", {
        name: form.name,
        description: form.description,
        image: form.image,
        discountPercent: Number(form.discountPercent) || 0,
        items: selected.map(s => ({ productId: s.productId, quantity: s.quantity })),
      });
      navigate("/bundles");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tạo combo! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bundle-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/bundles")}>← Quay lại</button>
        <h2>Thêm combo mới</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Thông tin combo</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="name">Tên combo *</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="VD: Combo Phòng Khách Tiết Kiệm"
                  required
                />
              </div>
              <div className="form-group full">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Mô tả ngắn về combo..."
                />
              </div>
              <div className="form-group full">
                <label htmlFor="image">URL ảnh đại diện combo (không bắt buộc)</label>
                <input
                  id="image"
                  value={form.image}
                  onChange={e => set("image", e.target.value)}
                  placeholder="Để trống sẽ tự dùng ảnh sản phẩm đầu tiên trong combo"
                />
              </div>
              <div className="form-group">
                <label htmlFor="discountPercent">Giảm thêm khi mua cả combo (%)</label>
                <input
                  id="discountPercent"
                  type="number"
                  min={0}
                  max={90}
                  value={form.discountPercent}
                  onChange={e => set("discountPercent", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Sản phẩm trong combo (chọn ít nhất 2)</h3>

            <div className="product-picker">
              <input
                type="text"
                placeholder="Gõ tên sản phẩm để thêm vào combo..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                disabled={loadingProducts}
              />
              {searchResults.length > 0 && (
                <div className="product-picker__results">
                  {searchResults.map(p => (
                    <button type="button" key={p.id} className="product-picker__item" onClick={() => addProduct(p)}>
                      <div className="product-picker__item-img">
                        {p.image ? <img src={p.image} alt={p.name} /> : <span>🪑</span>}
                      </div>
                      <div>
                        <p className="product-picker__item-name">{p.name}</p>
                        <p className="product-picker__item-price">{formatPrice(p.price * (1 - (p.discountPercent || 0) / 100))}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected.length === 0 ? (
              <p className="empty-note">Chưa chọn sản phẩm nào — gõ tên sản phẩm ở ô trên để thêm.</p>
            ) : (
              <div className="selected-items">
                {selected.map(item => (
                  <div className="selected-item" key={item.productId}>
                    <div className="selected-item__img">
                      {item.image ? <img src={item.image} alt={item.name} /> : <span>🪑</span>}
                    </div>
                    <span className="selected-item__name">{item.name}</span>
                    <span className="selected-item__price">{formatPrice(item.unitPrice)}</span>
                    <div className="qty-control">
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)}>−</button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => setQuantity(item.productId, e.target.value)}
                      />
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" className="selected-item__remove" onClick={() => removeProduct(item.productId)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {selected.length > 0 && (
              <div className="price-preview">
                <div className="price-preview__row">
                  <span>Tổng giá gốc</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="price-preview__row price-preview__row--final">
                  <span>Giá combo (sau giảm {form.discountPercent || 0}%)</span>
                  <strong>{formatPrice(finalPrice)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/bundles")}>Huỷ</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Thêm combo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BundleCreate;