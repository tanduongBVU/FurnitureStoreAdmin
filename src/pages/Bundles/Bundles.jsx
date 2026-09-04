import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./Bundles.css";

const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

const Bundles = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("adminUser");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "Admin";

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  const handleToggleActive = async (bundle) => {
    const willHide = bundle.isActive;
    const actionText = willHide ? "ẩn" : "hiện lại";
    if (!window.confirm(`Bạn có chắc muốn ${actionText} combo "${bundle.name}" không?`)) return;

    try {
      if (willHide) {
        await api.delete(`/Bundles/${bundle.id}`);
      } else {
        await api.patch(`/Bundles/${bundle.id}/restore`);
      }
      await fetchBundles();
    } catch {
      alert("Lỗi khi cập nhật trạng thái hiển thị combo!");
    }
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
        <button className="btn-add" onClick={() => navigate("/bundles/create")}>
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
                  <button className="btn-edit" onClick={() => navigate(`/bundles/edit/${b.id}`)}>✏️ Sửa</button>
                  {isAdmin && (
                    <button
                      className={b.isActive ? "btn-del" : "btn-restore"}
                      onClick={() => handleToggleActive(b)}
                    >
                      {b.isActive ? "🙈 Ẩn" : "👁️ Hiện lại"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bundles;