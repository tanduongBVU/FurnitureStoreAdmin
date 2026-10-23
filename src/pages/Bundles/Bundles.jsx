import { useState, useEffect } from "react";
import api from "../../services/Api";
import ConfirmDialog from "../../components/Modal/ConfirmDialog";
import BundleFormModal from "./BundleFormModal";
import "./Bundles.css";

const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

const Bundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Popup Thêm/Sửa: id = null → thêm mới, có id → sửa combo đó
  const [formModal, setFormModal] = useState({ open: false, id: null });
  // Hộp xác nhận Ẩn / Hiện lại
  const [confirm, setConfirm] = useState({ bundle: null, busy: false, error: "" });

  const fetchBundles = async () => {
    try {
      setLoading(true);
      setError("");
      // Dùng /Bundles/all để Admin xem được cả combo đã ẩn
      const res = await api.get("/Bundles/all");
      setBundles(res.data);
    } catch {
      setError("Không thể tải danh sách combo. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBundles(); }, []);

  const askToggleActive = (bundle) => setConfirm({ bundle, busy: false, error: "" });

  const doToggleActive = async () => {
    const bundle = confirm.bundle;
    if (!bundle) return;
    setConfirm(c => ({ ...c, busy: true, error: "" }));
    try {
      if (bundle.isActive) {
        await api.delete(`/Bundles/${bundle.id}`);
      } else {
        await api.patch(`/Bundles/${bundle.id}/restore`);
      }
      setConfirm({ bundle: null, busy: false, error: "" });
      await fetchBundles();
    } catch {
      setConfirm(c => ({ ...c, busy: false, error: "Lỗi khi cập nhật trạng thái hiển thị combo!" }));
    }
  };

  const handleSaved = () => {
    setFormModal({ open: false, id: null });
    fetchBundles();
  };

  const filtered = bundles.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bundles-page">
      <div className="bundles-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Tìm kiếm combo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-add" onClick={() => setFormModal({ open: true, id: null })}>
          + Thêm combo
        </button>
      </div>

      {error && (
        <div className="error-box">
          ⚠️ {error}
          <button onClick={fetchBundles}>Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="loading-box"><div className="spinner" /><p>Đang tải combo...</p></div>
      ) : (
        <div className="bundles-grid">
          {filtered.length === 0 ? (
            <p className="empty-note">Chưa có combo nào. Bấm "+ Thêm combo" để tạo mới.</p>
          ) : filtered.map(b => (
            <div className={`bundle-card ${!b.isActive ? "bundle-card--hidden" : ""}`} key={b.id}>
              <div className="bundle-card__img">
                {b.image || b.items[0]?.productImage
                  ? <img src={b.image || b.items[0]?.productImage} alt={b.name} />
                  : <span>🎁</span>}
                {b.discountPercent > 0 && (
                  <span className="bundle-card__discount">-{b.discountPercent}%</span>
                )}
              </div>
              <div className="bundle-card__body">
                <div className="bundle-card__top">
                  <strong>{b.name}</strong>
                  {b.isActive
                    ? <span className="badge badge--success">Đang bán</span>
                    : <span className="badge badge--muted">Đã ẩn</span>}
                </div>
                <p className="bundle-card__items-count">{b.items.length} sản phẩm trong combo</p>
                {/* Cảnh báo cho Admin/Nhân viên: combo có sản phẩm hết hàng thì khách không đặt được */}
                {b.isAvailable === false && (
                  <p style={{ margin: "4px 0 8px", fontSize: 12.5, color: "#b91c1c", fontWeight: 600 }}>
                    ⚠️ Hết hàng: {(b.outOfStockItems || []).join(", ")}
                  </p>
                )}
                <ul className="bundle-card__items-list">
                  {b.items.slice(0, 3).map(item => (
                    <li key={item.productId}>{item.productName} x{item.quantity}</li>
                  ))}
                  {b.items.length > 3 && <li>...và {b.items.length - 3} sản phẩm khác</li>}
                </ul>
                <div className="bundle-card__price">
                  {b.discountPercent > 0 && (
                    <span className="bundle-card__price-original">{formatPrice(b.subtotal)}</span>
                  )}
                  <strong>{formatPrice(b.finalPrice)}</strong>
                </div>
                <div className="bundle-card__actions">
                  <button className="btn-edit" onClick={() => setFormModal({ open: true, id: b.id })}>✏️ Sửa</button>
                  <button
                    className={b.isActive ? "btn-del" : "btn-restore"}
                    onClick={() => askToggleActive(b)}
                  >
                    {b.isActive ? "🙈 Ẩn" : "👁️ Hiện lại"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup Thêm / Sửa combo — mount lại mỗi lần mở (key) để form luôn sạch */}
      {formModal.open && (
        <BundleFormModal
          key={formModal.id ?? "new"}
          bundleId={formModal.id}
          onClose={() => setFormModal({ open: false, id: null })}
          onSaved={handleSaved}
        />
      )}

      {/* Xác nhận Ẩn / Hiện lại combo */}
      <ConfirmDialog
        open={!!confirm.bundle}
        title={confirm.bundle?.isActive ? "Ẩn combo" : "Hiện lại combo"}
        message={`Bạn có chắc muốn ${confirm.bundle?.isActive ? "ẩn" : "hiện lại"} combo "${confirm.bundle?.name ?? ""}" không?`}
        note={confirm.bundle?.isActive
          ? "Combo sẽ không còn hiện cho khách, có thể hiện lại bất cứ lúc nào."
          : "Combo sẽ hiện lại cho khách."}
        confirmLabel={confirm.bundle?.isActive ? "Ẩn combo" : "Hiện lại"}
        danger={!!confirm.bundle?.isActive}
        busy={confirm.busy}
        error={confirm.error}
        onConfirm={doToggleActive}
        onCancel={() => setConfirm({ bundle: null, busy: false, error: "" })}
      />
    </div>
  );
};

export default Bundles;