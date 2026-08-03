import "./Dashboard.css";

const stats = [
  { label: "Tổng doanh thu", value: "248.500.000 ₫", change: "+12.5%", up: true,  icon: "💰", color: "#4f72e3" },
  { label: "Đơn hàng mới",   value: "38",             change: "+8.2%",  up: true,  icon: "📦", color: "#22c55e" },
  { label: "Sản phẩm",       value: "124",            change: "+3",     up: true,  icon: "🪑", color: "#f59e0b" },
  { label: "Liên hệ mới",    value: "12",             change: "-2",     up: false, icon: "✉️", color: "#ef4444" },
];

const recentOrders = [
  { id: "#DH001", customer: "Nguyễn Văn An",  product: "Sofa Oslo",       total: "18.500.000 ₫", status: "Hoàn thành" },
  { id: "#DH002", customer: "Trần Thị Bình",  product: "Bàn ăn Walnut",   total: "24.900.000 ₫", status: "Đang xử lý" },
  { id: "#DH003", customer: "Lê Hoàng Cường", product: "Giường Nordic",   total: "14.200.000 ₫", status: "Đang giao"  },
  { id: "#DH004", customer: "Phạm Thu Dung",  product: "Kệ TV tối giản",  total: "8.700.000 ₫",  status: "Huỷ"       },
  { id: "#DH005", customer: "Vũ Minh Đức",    product: "Tủ quần áo Oak",  total: "32.000.000 ₫", status: "Hoàn thành" },
];

const statusClass = { "Hoàn thành": "badge--success", "Đang xử lý": "badge--warning", "Đang giao": "badge--info", "Huỷ": "badge--danger" };

const Dashboard = () => (
  <div className="dashboard">

    {/* Stats */}
    <div className="stats-grid">
      {stats.map((s, i) => (
        <div className="stat-card" key={i}>
          <div className="stat-card__icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
          <div className="stat-card__info">
            <p className="stat-card__label">{s.label}</p>
            <h3 className="stat-card__value">{s.value}</h3>
            <span className={`stat-card__change ${s.up ? "up" : "down"}`}>
              {s.up ? "↑" : "↓"} {s.change} so với tháng trước
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Recent Orders */}
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Đơn hàng gần đây</h2>
        <a href="/orders" className="view-all">Xem tất cả →</a>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong></td>
                <td>{o.customer}</td>
                <td>{o.product}</td>
                <td><strong>{o.total}</strong></td>
                <td><span className={`badge ${statusClass[o.status]}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Quick Info */}
    <div className="quick-grid">
      <div className="dashboard-card">
        <div className="dashboard-card__header"><h2>Sản phẩm sắp hết hàng</h2></div>
        {["Sofa Oslo (còn 2)", "Kệ TV Oak (còn 1)", "Bàn trà Nordic (còn 3)"].map((item, i) => (
          <div className="quick-item" key={i}>
            <span>🪑 {item}</span>
            <span className="badge badge--warning">Sắp hết</span>
          </div>
        ))}
      </div>
      <div className="dashboard-card">
        <div className="dashboard-card__header"><h2>Liên hệ chưa xử lý</h2></div>
        {["Nguyễn Thị Mai — Tư vấn sofa", "Trần Văn Hùng — Báo giá nội thất", "Lê Thu Hà — Hỏi về bảo hành"].map((item, i) => (
          <div className="quick-item" key={i}>
            <span>✉️ {item}</span>
            <span className="badge badge--danger">Mới</span>
          </div>
        ))}
      </div>
    </div>

  </div>
);

export default Dashboard;
