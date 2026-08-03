import { useState } from "react";
import "./Products.css";

// ── Data mẫu ──────────────────────────────────────────
const CATEGORIES = ["Tất cả", "Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Ban công"];

const initProducts = [
  { id: 1, name: "Sofa Bắc Âu Oslo",       category: "Phòng khách",    price: 18500000, stock: 2,  status: "Còn hàng",   img: "🛋️" },
  { id: 2, name: "Bàn ăn Walnut 6 ghế",    category: "Phòng ăn",       price: 24900000, stock: 5,  status: "Còn hàng",   img: "🍽️" },
  { id: 3, name: "Giường ngủ Nordic",       category: "Phòng ngủ",      price: 14200000, stock: 1,  status: "Sắp hết",    img: "🛏️" },
  { id: 4, name: "Kệ TV tối giản Oak",      category: "Phòng khách",    price: 8700000,  stock: 0,  status: "Hết hàng",   img: "📺" },
  { id: 5, name: "Bàn làm việc Walnut",     category: "Phòng làm việc", price: 12500000, stock: 8,  status: "Còn hàng",   img: "💼" },
  { id: 6, name: "Tủ quần áo 3 cánh Oak",  category: "Phòng ngủ",      price: 32000000, stock: 3,  status: "Còn hàng",   img: "🚪" },
  { id: 7, name: "Ghế ăn Scandinavia",      category: "Phòng ăn",       price: 3200000,  stock: 12, status: "Còn hàng",   img: "🪑" },
  { id: 8, name: "Bàn trà Nordic tròn",     category: "Phòng khách",    price: 6800000,  stock: 1,  status: "Sắp hết",    img: "☕" },
  { id: 9, name: "Ghế công thái học E200",  category: "Phòng làm việc", price: 9500000,  stock: 6,  status: "Còn hàng",   img: "🖥️" },
  { id: 10, name: "Bộ bàn ghế ban công",   category: "Ban công",        price: 7200000,  stock: 4,  status: "Còn hàng",   img: "🌿" },
];

const EMPTY_FORM = { name: "", category: "Phòng khách", price: "", stock: "", status: "Còn hàng", img: "🪑" };
const PAGE_SIZE = 6;

const statusClass = { "Còn hàng": "badge--success", "Sắp hết": "badge--warning", "Hết hàng": "badge--danger" };

// ── Modal Form ─────────────────────────────────────────
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState(product || EMPTY_FORM);
  const isEdit = !!product?.id;

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) return;
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-row">
            <div className="form-group">
              <label>Tên sản phẩm *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="VD: Sofa Oslo" required />
            </div>
            <div className="form-group">
              <label>Danh mục *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Giá (₫) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="VD: 18500000" required />
            </div>
            <div className="form-group">
              <label>Tồn kho *</label>
              <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="VD: 10" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Trạng thái</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                <option>Còn hàng</option>
                <option>Sắp hết</option>
                <option>Hết hàng</option>
              </select>
            </div>
            <div className="form-group">
              <label>Icon (emoji tạm)</label>
              <input value={form.img} onChange={e => set("img", e.target.value)} placeholder="🪑" />
            </div>
          </div>
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-save">{isEdit ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Confirm Delete ─────────────────────────────────────
const ConfirmModal = ({ name, onClose, onConfirm }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
      <div className="modal__header">
        <h3>Xác nhận xoá</h3>
        <button className="modal__close" onClick={onClose}>✕</button>
      </div>
      <p className="confirm-text">Bạn có chắc muốn xoá sản phẩm <strong>"{name}"</strong> không? Hành động này không thể hoàn tác.</p>
      <div className="modal__actions">
        <button className="btn-cancel" onClick={onClose}>Huỷ</button>
        <button className="btn-delete" onClick={onConfirm}>Xoá</button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────
const Products = () => {
  const [products, setProducts] = useState(initProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  // Filter
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Tất cả" || p.category === category;
    return matchSearch && matchCat;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = (form) => {
    if (form.id) {
      setProducts(ps => ps.map(p => p.id === form.id ? form : p));
    } else {
      setProducts(ps => [...ps, { ...form, id: Date.now() }]);
    }
    setShowModal(false);
    setEditProduct(null);
  };

  const handleDelete = () => {
    setProducts(ps => ps.filter(p => p.id !== deleteProduct.id));
    setDeleteProduct(null);
  };

  const openEdit = (p) => { setEditProduct(p); setShowModal(true); };
  const openAdd  = () => { setEditProduct(null); setShowModal(true); };

  const formatPrice = (n) => n.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="products-page">

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-tabs">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`filter-tab ${category === c ? "filter-tab--active" : ""}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >{c}</button>
            ))}
          </div>
        </div>
        <button className="btn-add" onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      {/* Summary */}
      <div className="products-summary">
        <span>Hiển thị <strong>{paginated.length}</strong> / <strong>{filtered.length}</strong> sản phẩm</span>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">Không tìm thấy sản phẩm nào</td></tr>
              ) : paginated.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <span className="product-cell__img">{p.img}</span>
                      <div>
                        <p className="product-cell__name">{p.name}</p>
                        <p className="product-cell__id">#{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="category-tag">{p.category}</span></td>
                  <td><strong>{formatPrice(p.price)}</strong></td>
                  <td>
                    <span className={p.stock === 0 ? "stock-zero" : p.stock <= 2 ? "stock-low" : "stock-ok"}>
                      {p.stock}
                    </span>
                  </td>
                  <td><span className={`badge ${statusClass[p.status]}`}>{p.status}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit" onClick={() => openEdit(p)}>✏️ Sửa</button>
                      <button className="btn-del"  onClick={() => setDeleteProduct(p)}>🗑️ Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n === page ? "page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
      {deleteProduct && (
        <ConfirmModal
          name={deleteProduct.name}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default Products;
