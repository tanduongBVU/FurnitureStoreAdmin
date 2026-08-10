import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "./Orders.css";

const STATUS_LIST = ["Tất cả", "Chờ xác nhận", "Đang xử lý", "Đang giao", "Hoàn thành", "Huỷ"];
const STATUS_CLASS = {
  "Chờ xác nhận": "badge--pending",
  "Đang xử lý":   "badge--warning",
  "Đang giao":    "badge--info",
  "Hoàn thành":   "badge--success",
  "Huỷ":          "badge--danger",
};
const PAGE_SIZE = 6;

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Orders");
      setOrders(res.data);
    } catch {
      setError("Không thể tải danh sách đơn hàng. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                        String(o.id).includes(search);
    const matchStatus = statusFilter === "Tất cả" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="orders-page">

      {/* Stats */}
      <div className="order-stats">
        {STATUS_LIST.filter(s => s !== "Tất cả").map(s => (
          <div className="order-stat" key={s}>
            <span className={`badge ${STATUS_CLASS[s]}`}>{s}</span>
            <strong>{orders.filter(o => o.status === s).length}</strong>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            placeholder="Tìm mã đơn hoặc tên khách hàng..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-tabs">
          {STATUS_LIST.map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          ⚠️ {error}
          <button onClick={fetchOrders}>Thử lại</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-box"><div className="spinner" /><p>Đang tải đơn hàng...</p></div>
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">Không tìm thấy đơn hàng nào</td></tr>
                ) : paginated.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <p className="cust-name">{o.customerName}</p>
                      <p className="cust-phone">{o.phone}</p>
                    </td>
                    <td className="products-col">
                      {o.orderItems?.map(i => `${i.productName} x${i.quantity}`).join(", ") || "—"}
                    </td>
                    <td><strong>{Number(o.total).toLocaleString("vi-VN")} ₫</strong></td>
                    <td>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td><span className={`badge ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                    <td>
                      <button className="btn-view" onClick={() => navigate(`/orders/${o.id}`)}>👁️ Chi tiết</button>
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
                <button key={n} className={`page-btn ${n === page ? "page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
