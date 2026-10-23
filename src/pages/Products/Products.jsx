import { useState, useEffect } from "react";
import api from "../../services/Api";
import ConfirmDialog from "../../components/Modal/ConfirmDialog";
import ProductFormModal from "./ProductFormModal";
import "./Products.css";

// Phải khớp với danh sách danh mục ở form thêm/sửa sản phẩm (ProductCreate/ProductEdit)
const CATEGORIES = ["Tất cả", "Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Phòng tắm", "Ban công"];
const PAGE_SIZE = 6;
const statusOf = (stock) => stock === 0 ? "Hết hàng" : stock <= 2 ? "Sắp hết" : "Còn hàng";
const STATUS_CLASS = { "Còn hàng": "badge--success", "Sắp hết": "badge--warning", "Hết hàng": "badge--danger" };

const Products = () => {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("Tất cả");
  const [page, setPage]           = useState(1);
  // Popup Thêm/Sửa: id = null → thêm mới, có id → sửa sản phẩm đó
  const [formModal, setFormModal] = useState({ open: false, id: null });
  // Hộp xác nhận Ẩn / Hiện lại
  const [confirm, setConfirm] = useState({ product: null, busy: false, error: "" });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      // Dùng /Products/all để Admin xem được cả sản phẩm đã ẩn
      const res = await api.get("/Products/all");
      setProducts(res.data);
    } catch {
      setError("Không thể tải danh sách sản phẩm. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const askToggleActive = (product) => setConfirm({ product, busy: false, error: "" });

  const doToggleActive = async () => {
    const product = confirm.product;
    if (!product) return;
    setConfirm(c => ({ ...c, busy: true, error: "" }));
    try {
      if (product.isActive) {
        await api.delete(`/Products/${product.id}`);
      } else {
        await api.patch(`/Products/${product.id}/restore`);
      }
      setConfirm({ product: null, busy: false, error: "" });
      await fetchProducts();
    } catch {
      setConfirm(c => ({ ...c, busy: false, error: "Lỗi khi cập nhật trạng thái hiển thị sản phẩm!" }));
    }
  };

  const handleSaved = () => {
    setFormModal({ open: false, id: null });
    fetchProducts();
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "Tất cả" || p.category === category;
    return matchSearch && matchCat;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

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
              <button key={c}
                className={`filter-tab ${category === c ? "filter-tab--active" : ""}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >{c}</button>
            ))}
          </div>
        </div>
        <button className="btn-add" onClick={() => setFormModal({ open: true, id: null })}>
          + Thêm sản phẩm
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          ⚠️ {error}
          <button onClick={fetchProducts}>Thử lại</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-box">
          <div className="spinner" /><p>Đang tải sản phẩm...</p>
        </div>
      ) : (
        <>
          <div className="products-summary">
            Hiển thị <strong>{paginated.length}</strong> / <strong>{filtered.length}</strong> sản phẩm
            {products.length > 0 && <span> (tổng {products.length} trong DB)</span>}
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Giảm giá</th>
                    <th>Tồn kho</th>
                    <th>Bán chạy</th>
                    <th>Kho hàng</th>
                    <th>Hiển thị</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={9} className="empty-row">Không tìm thấy sản phẩm nào</td></tr>
                  ) : paginated.map(p => (
                    <tr key={p.id} className={!p.isActive ? "row--hidden" : ""}>
                      <td>
                        <div className="product-cell">
                          <div className="product-cell__img">
                            {p.image ? <img src={p.image} alt={p.name} /> : "🪑"}
                          </div>
                          <div>
                            <p className="product-cell__name">{p.name}</p>
                            <p className="product-cell__id">#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="category-tag">{p.category || "—"}</span></td>
                      <td>
                        {p.discountPercent > 0 ? (
                          <div>
                            <span style={{ textDecoration: "line-through", color: "#aaa", fontSize: 12, display: "block" }}>
                              {formatPrice(p.price)}
                            </span>
                            <strong style={{ color: "#b91c1c" }}>
                              {formatPrice(p.price * (1 - p.discountPercent / 100))}
                            </strong>
                          </div>
                        ) : (
                          <strong>{formatPrice(p.price)}</strong>
                        )}
                      </td>
                      <td>
                        {p.discountPercent > 0
                          ? <span className="badge badge--danger">-{p.discountPercent}%</span>
                          : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td>
                        <span className={p.stock === 0 ? "stock-zero" : p.stock <= 2 ? "stock-low" : "stock-ok"}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        {p.isBestSeller
                          ? <span className="badge badge--success">✓ Có</span>
                          : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[statusOf(p.stock)]}`}>
                          {statusOf(p.stock)}
                        </span>
                      </td>
                      <td>
                        {p.isActive
                          ? <span className="badge badge--success">Đang bán</span>
                          : <span className="badge badge--muted">Đã ẩn</span>}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => setFormModal({ open: true, id: p.id })}>✏️ Sửa</button>
                          <button
                            className={p.isActive ? "btn-del" : "btn-restore"}
                            onClick={() => askToggleActive(p)}
                          >
                            {p.isActive ? "🙈 Ẩn" : "👁️ Hiện lại"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`page-btn ${n === page ? "page-btn--active" : ""}`}
                    onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Popup Thêm / Sửa sản phẩm — mount lại mỗi lần mở (key) để form luôn sạch */}
      {formModal.open && (
        <ProductFormModal
          key={formModal.id ?? "new"}
          productId={formModal.id}
          onClose={() => setFormModal({ open: false, id: null })}
          onSaved={handleSaved}
        />
      )}

      {/* Xác nhận Ẩn / Hiện lại sản phẩm */}
      <ConfirmDialog
        open={!!confirm.product}
        title={confirm.product?.isActive ? "Ẩn sản phẩm" : "Hiện lại sản phẩm"}
        message={`Bạn có chắc muốn ${confirm.product?.isActive ? "ẩn" : "hiện lại"} sản phẩm "${confirm.product?.name ?? ""}" không?`}
        note={confirm.product?.isActive
          ? "Sản phẩm sẽ không còn hiện cho khách. Dữ liệu và lịch sử đơn hàng được giữ nguyên, có thể hiện lại bất cứ lúc nào."
          : "Sản phẩm sẽ hiện lại cho khách."}
        confirmLabel={confirm.product?.isActive ? "Ẩn sản phẩm" : "Hiện lại"}
        danger={!!confirm.product?.isActive}
        busy={confirm.busy}
        error={confirm.error}
        onConfirm={doToggleActive}
        onCancel={() => setConfirm({ product: null, busy: false, error: "" })}
      />
    </div>
  );
};

export default Products;