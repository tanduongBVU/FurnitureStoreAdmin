import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import "./OrderDetail.css";

const STATUS_LIST = ["Chờ xác nhận", "Đang xử lý", "Đang giao", "Hoàn thành", "Huỷ"];

// LƯU Ý: 2 giá trị này PHẢI khớp CHÍNH XÁC với chuỗi Backend đang lưu ở cột PaymentStatus
// (xem Order.cs / OrdersController.cs), và giống hệt 2 hằng số cùng tên ở Orders.jsx.
const PAYMENT_PAID = "Đã thanh toán";
const PAYMENT_UNPAID = "Chưa thanh toán";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/Orders/${id}`)
      .then(res => { setOrder(res.data); setStatus(res.data.status); })
      .catch(() => setError("Không tìm thấy đơn hàng!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/Orders/${id}/status`, JSON.stringify(status), {
        headers: { "Content-Type": "application/json" }
      });
      navigate("/orders");
    } catch {
      setError("Lỗi khi cập nhật trạng thái!");
      setSaving(false);
    }
  };

  // Xác nhận đã nhận tiền — có hiệu lực NGAY khi bấm (độc lập với nút "Lưu trạng thái"
  // bên dưới), và Admin ở lại trang này để xem kết quả thay vì bị đưa về danh sách.
  const handleConfirmPayment = async () => {
    if (!window.confirm(`Xác nhận đã nhận đủ tiền của đơn #${order.id}?`)) return;
    setConfirmingPayment(true);
    setError("");
    try {
      await api.patch(`/Orders/${id}/payment-status`, JSON.stringify(PAYMENT_PAID), {
        headers: { "Content-Type": "application/json" }
      });
      setOrder(prev => ({ ...prev, paymentStatus: PAYMENT_PAID }));
    } catch {
      setError("Lỗi khi xác nhận thanh toán!");
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) return (
    <div className="order-detail-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
    </div>
  );

  if (!order) return (
    <div className="order-detail-page">
      <div className="form-error">⚠️ Không tìm thấy đơn hàng!</div>
      <button className="btn-back" onClick={() => navigate("/orders")}>← Quay lại</button>
    </div>
  );

  const paid = order.paymentStatus === PAYMENT_PAID;

  return (
    <div className="order-detail-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/orders")}>← Quay lại</button>
        <h2>Chi tiết đơn hàng #{order.id}</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <div className="detail-grid">
          <div className="detail-section">
            <h3>Thông tin khách hàng</h3>
            <p><span>Họ tên:</span> <strong>{order.customerName}</strong></p>
            <p><span>Điện thoại:</span> {order.phone}</p>
            <p><span>Địa chỉ:</span> {order.address}</p>
            <p><span>Ngày đặt:</span> {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>
          <div className="detail-section">
            <h3>Sản phẩm đặt</h3>
            {order.orderItems?.length > 0
              ? order.orderItems.map((item, i) => (
                  <p key={i}><span>•</span> {item.productName} x{item.quantity} — {Number(item.price).toLocaleString("vi-VN")} ₫</p>
                ))
              : <p style={{color:"#999"}}>Không có sản phẩm</p>
            }
            <div className="detail-total">
              <span>Tổng tiền:</span>
              <strong>{Number(order.total).toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>
        </div>

        <div className="status-update">
          <h3>Thanh toán</h3>
          <p style={{ margin: "0 0 8px", fontSize: 14 }}>
            <span style={{ color: "#64748b" }}>Phương thức:</span>{" "}
            <strong>{order.paymentMethod || "COD"}</strong>
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            <span style={{ color: "#64748b" }}>Trạng thái:</span>{" "}
            <span className={`badge ${paid ? "badge--success" : "badge--pending"}`}>
              {paid ? PAYMENT_PAID : PAYMENT_UNPAID}
            </span>
          </p>
          {/* Chỉ hiện khi đơn chưa thanh toán và chưa bị huỷ */}
          {!paid && order.status !== "Huỷ" && (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
              style={{
                background: "#16a34a", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 18px", fontSize: 14, fontWeight: 600,
                cursor: confirmingPayment ? "not-allowed" : "pointer",
                opacity: confirmingPayment ? 0.6 : 1,
              }}
            >
              {confirmingPayment ? "Đang xác nhận..." : "✓ Xác nhận đã nhận tiền"}
            </button>
          )}
        </div>

        <div className="status-update">
          <h3>Cập nhật trạng thái</h3>
          <div className="status-options">
            {STATUS_LIST.map(s => (
              <button
                key={s}
                className={`status-opt ${status === s ? "status-opt--active" : ""}`}
                onClick={() => setStatus(s)}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={() => navigate("/orders")}>Huỷ</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu trạng thái"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;