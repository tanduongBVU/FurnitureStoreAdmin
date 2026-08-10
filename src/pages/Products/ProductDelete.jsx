import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import "./ProductForm.css";

const ProductDelete = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/Products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => setError("Không tìm thấy sản phẩm!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/Products/${id}`);
      navigate("/products");
    } catch {
      setError("Lỗi khi xoá sản phẩm! Kiểm tra lại backend.");
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="product-form-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
    </div>
  );

  return (
    <div className="product-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/products")}>← Quay lại</button>
        <h2>Xoá sản phẩm</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      {product && (
        <div className="delete-card">
          <div className="delete-icon">🗑️</div>
          <h3>Bạn có chắc muốn xoá sản phẩm này?</h3>
          <p>Hành động này <strong>không thể hoàn tác</strong>.</p>

          <div className="product-preview">
            <div className="product-preview__img">
              {product.image
                ? <img src={product.image} alt={product.name} onError={e => e.target.style.display="none"} />
                : <span>🪑</span>
              }
            </div>
            <div className="product-preview__info">
              <h4>{product.name}</h4>
              <p>Danh mục: <strong>{product.category || "—"}</strong></p>
              <p>Giá: <strong>{Number(product.price).toLocaleString("vi-VN")} ₫</strong></p>
              <p>Tồn kho: <strong>{product.stock}</strong></p>
            </div>
          </div>

          <div className="delete-actions">
            <button className="btn-cancel" onClick={() => navigate("/products")}>Huỷ bỏ</button>
            <button className="btn-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Đang xoá..." : "Xác nhận xoá"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDelete;
