import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/Api";
import "./Dashboard.css";

const STATUS_BADGE = {
  "Hoàn thành": "badge--success",
  "Đang xử lý": "badge--warning",
  "Đang giao": "badge--info",
  "Chờ xác nhận": "badge--warning",
  "Huỷ": "badge--danger",
};

const formatPrice = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";
const formatDateShort = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const isSameMonth = (dateStr, ref) => {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

// % thay đổi so với kỳ trước — prev = 0 thì coi như tăng 100% nếu có phát sinh, tránh chia cho 0
const pctChange = (curr, prev) => {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
};

// Bảng màu cố định cho các danh mục — lặp lại nếu nhiều hơn số màu, đủ dùng cho các
// danh mục phòng hiện có (Phòng khách, Phòng ngủ, Phòng ăn, Phòng làm việc, Ban công...)
const CATEGORY_COLORS = ["#4f72e3", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Số ngày hiển thị trong biểu đồ doanh thu — khách Admin tự chọn 7 / 14 / 30 ngày gần nhất
  const [chartRange, setChartRange] = useState(14);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [ordersRes, productsRes, contactsRes] = await Promise.all([
          api.get("/Orders"),
          api.get("/Products/all"),
          api.get("/Contacts"),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setContacts(contactsRes.data);
      } catch {
        setError("Không thể tải dữ liệu Dashboard. Kiểm tra backend đang chạy chưa, và tài khoản có đủ quyền Admin/Nhân viên không.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading"><div className="spinner" /><p>Đang tải dữ liệu...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">⚠️ {error}</div>
      </div>
    );
  }

  const now = new Date();
  const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // ── Doanh thu (chỉ tính đơn Hoàn thành) ──
  const completedOrders = orders.filter(o => o.status === "Hoàn thành");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const revenueThisMonth = completedOrders.filter(o => isSameMonth(o.createdAt, now)).reduce((s, o) => s + o.total, 0);
  const revenueLastMonth = completedOrders.filter(o => isSameMonth(o.createdAt, lastMonthRef)).reduce((s, o) => s + o.total, 0);
  const revenueChange = pctChange(revenueThisMonth, revenueLastMonth);

  // ── Đơn hàng ──
  const ordersThisMonth = orders.filter(o => isSameMonth(o.createdAt, now)).length;
  const ordersLastMonth = orders.filter(o => isSameMonth(o.createdAt, lastMonthRef)).length;
  const ordersChange = pctChange(ordersThisMonth, ordersLastMonth);

  // ── Sản phẩm ──
  const activeProducts = products.filter(p => p.isActive);
  const newProductsThisMonth = products.filter(p => isSameMonth(p.createdAt, now)).length;

  // ── Liên hệ ──
  const newContacts = contacts.filter(c => c.status === "Mới");
  const contactsThisMonth = contacts.filter(c => isSameMonth(c.createdAt, now)).length;
  const contactsLastMonth = contacts.filter(c => isSameMonth(c.createdAt, lastMonthRef)).length;
  const contactsDelta = contactsThisMonth - contactsLastMonth;

  const stats = [
    {
      label: "Tổng doanh thu", value: formatPrice(totalRevenue),
      change: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% so với tháng trước`,
      up: revenueChange >= 0, icon: "💰", color: "#4f72e3",
    },
    {
      label: "Đơn hàng tháng này", value: String(ordersThisMonth),
      change: `${ordersChange >= 0 ? "+" : ""}${ordersChange.toFixed(1)}% so với tháng trước`,
      up: ordersChange >= 0, icon: "📦", color: "#22c55e",
    },
    {
      label: "Sản phẩm đang bán", value: String(activeProducts.length),
      change: `+${newProductsThisMonth} mới trong tháng`,
      up: true, icon: "🪑", color: "#f59e0b",
    },
    {
      label: "Liên hệ chưa xử lý", value: String(newContacts.length),
      change: `${contactsDelta >= 0 ? "+" : ""}${contactsDelta} so với tháng trước`,
      up: contactsDelta <= 0, icon: "✉️", color: "#ef4444",
    },
  ];

  // ── Biểu đồ doanh thu N ngày gần nhất (mọi đơn trừ đơn đã Huỷ) — N do Admin chọn qua chartRange ──
  const days = Array.from({ length: chartRange }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartRange - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const chartData = days.map(day => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = orders
      .filter(o => o.status !== "Huỷ")
      .filter(o => {
        const c = new Date(o.createdAt);
        return c >= day && c < next;
      })
      .reduce((s, o) => s + o.total, 0);
    return { date: day, total };
  });
  const maxChartValue = Math.max(1, ...chartData.map(d => d.total));
  const hasChartData = chartData.some(d => d.total > 0);

  // ── Đơn hàng gần đây (5 gần nhất) ──
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ── Sản phẩm sắp hết hàng / bán chạy (đánh dấu thủ công) ──
  const lowStock = activeProducts
    .filter(p => p.stock > 0 && p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  const bestSellers = activeProducts.filter(p => p.isBestSeller).slice(0, 5);

  // ── Liên hệ mới nhất (3) ──
  const recentContacts = [...contacts]
    .filter(c => c.status === "Mới")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // ══════════════════════════════════════════════════════════════
  // THỐNG KÊ NÂNG CAO
  // ══════════════════════════════════════════════════════════════

  // Map productId → category, dùng để quy đổi OrderItem (chỉ có productId/productName)
  // về đúng danh mục sản phẩm, vì OrderItem không lưu sẵn category.
  const categoryById = Object.fromEntries(products.map(p => [p.id, p.category || "Khác"]));

  // ── 1. Doanh thu theo danh mục (chỉ tính đơn Hoàn thành, giống cách tính totalRevenue) ──
  const revenueByCategory = {};
  completedOrders.forEach(o => {
    o.orderItems.forEach(item => {
      const cat = categoryById[item.productId] || "Khác";
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + item.price * item.quantity;
    });
  });
  const categoryStats = Object.entries(revenueByCategory)
    .map(([category, revenue], i) => ({ category, revenue, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
    .sort((a, b) => b.revenue - a.revenue);
  const totalCategoryRevenue = categoryStats.reduce((s, c) => s + c.revenue, 0);

  // ── 2. Sản phẩm bán chạy / bán chậm nhất theo SỐ LƯỢNG THỰC BÁN
  // (khác với "isBestSeller" ở trên — đó là cờ Admin tự đánh dấu thủ công, còn đây là
  // số liệu thực tế tính từ OrderItems của các đơn Hoàn thành). ──
  const soldQtyByProduct = {};
  completedOrders.forEach(o => {
    o.orderItems.forEach(item => {
      soldQtyByProduct[item.productId] = (soldQtyByProduct[item.productId] || 0) + item.quantity;
    });
  });
  const productSalesRanking = Object.entries(soldQtyByProduct)
    .map(([productId, qty]) => {
      const product = products.find(p => p.id === Number(productId));
      return { id: Number(productId), name: product?.name || `Sản phẩm #${productId}`, qty };
    })
    .sort((a, b) => b.qty - a.qty);
  const topSelling = productSalesRanking.slice(0, 5);
  // Bán chậm nhất: CHỈ xét trong số sản phẩm ĐÃ CÓ ít nhất 1 lượt bán — sản phẩm chưa
  // từng bán (0 lượt) không đưa vào đây vì không phản ánh đúng ý "bán chậm", mà chỉ
  // đơn giản là chưa ai mua (có thể do mới đăng, không phải do ế).
  const worstSelling = [...productSalesRanking].reverse().slice(0, 5);

  return (
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
                {s.up ? "↑" : "↓"} {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Doanh thu {chartRange} ngày gần nhất</h2>
          <div className="chart-range-toggle">
            {[7, 14, 30].map(n => (
              <button
                key={n}
                className={`chart-range-btn ${chartRange === n ? "chart-range-btn--active" : ""}`}
                onClick={() => setChartRange(n)}
              >
                {n} ngày
              </button>
            ))}
          </div>
        </div>
        {!hasChartData ? (
          <p className="empty-note">Chưa có đơn hàng nào trong {chartRange} ngày qua.</p>
        ) : (
          <div className="revenue-chart">
            {chartData.map((d, i) => {
              const heightPct = Math.max(2, (d.total / maxChartValue) * 100);
              return (
                <div className="revenue-bar-col" key={i}>
                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar"
                      style={{ height: `${heightPct}%` }}
                      title={`${formatDateShort(d.date)}: ${formatPrice(d.total)}`}
                    />
                  </div>
                  {/* Ẩn bớt nhãn ngày khi hiện 30 cột để tránh chữ chồng lên nhau — chỉ hiện
                      mỗi ngày thứ 2 (i chẵn) khi chartRange lớn. */}
                  {(chartRange <= 14 || i % 2 === 0) && (
                    <span className="revenue-bar-label">{formatDateShort(d.date)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Doanh thu theo danh mục + Bán chạy/bán chậm ── */}
      <div className="quick-grid">
        <div className="dashboard-card">
          <div className="dashboard-card__header"><h2>Doanh thu theo danh mục</h2></div>
          {categoryStats.length === 0 ? (
            <p className="empty-note">Chưa có dữ liệu doanh thu (chỉ tính đơn Hoàn thành).</p>
          ) : (
            <div className="category-revenue-list">
              {categoryStats.map((c) => {
                const pct = totalCategoryRevenue > 0 ? (c.revenue / totalCategoryRevenue) * 100 : 0;
                return (
                  <div className="category-revenue-row" key={c.category}>
                    <div className="category-revenue-row__top">
                      <span className="category-revenue-row__name">
                        <span className="category-revenue-dot" style={{ background: c.color }} />
                        {c.category}
                      </span>
                      <strong>{formatPrice(c.revenue)}</strong>
                    </div>
                    <div className="category-revenue-bar-track">
                      <div
                        className="category-revenue-bar-fill"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card__header"><h2>Bán chạy / bán chậm (theo số lượng)</h2></div>
          {productSalesRanking.length === 0 ? (
            <p className="empty-note">Chưa có sản phẩm nào được bán (đơn Hoàn thành).</p>
          ) : (
            <div className="ranking-columns">
              <div className="ranking-col">
                <p className="ranking-col__title">🔥 Bán chạy nhất</p>
                {topSelling.map((p, i) => (
                  <div className="ranking-item" key={p.id}>
                    <span className="ranking-item__rank">{i + 1}</span>
                    <span className="ranking-item__name">{p.name}</span>
                    <strong>{p.qty} đã bán</strong>
                  </div>
                ))}
              </div>
              <div className="ranking-col">
                <p className="ranking-col__title">🐌 Bán chậm nhất</p>
                {worstSelling.map((p, i) => (
                  <div className="ranking-item" key={p.id}>
                    <span className="ranking-item__rank">{i + 1}</span>
                    <span className="ranking-item__name">{p.name}</span>
                    <strong>{p.qty} đã bán</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Đơn hàng gần đây</h2>
          <Link to="/orders" className="view-all">Xem tất cả →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="empty-note">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.customerName}</td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || "badge--info"}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="quick-grid">
        <div className="dashboard-card">
          <div className="dashboard-card__header"><h2>Sản phẩm sắp hết hàng</h2></div>
          {lowStock.length === 0 ? (
            <p className="empty-note">Không có sản phẩm nào sắp hết hàng.</p>
          ) : lowStock.map((p) => (
            <div className="quick-item" key={p.id}>
              <span>🪑 {p.name} (còn {p.stock})</span>
              <span className="badge badge--warning">Sắp hết</span>
            </div>
          ))}
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card__header"><h2>Liên hệ chưa xử lý</h2></div>
          {recentContacts.length === 0 ? (
            <p className="empty-note">Không có liên hệ mới nào.</p>
          ) : recentContacts.map((c) => (
            <div className="quick-item" key={c.id}>
              <span>✉️ {c.name} — {c.message?.length > 32 ? c.message.slice(0, 32) + "..." : c.message}</span>
              <span className="badge badge--danger">Mới</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best sellers (đánh dấu thủ công) */}
      <div className="dashboard-card">
        <div className="dashboard-card__header"><h2>Sản phẩm bán chạy (đánh dấu thủ công)</h2></div>
        {bestSellers.length === 0 ? (
          <p className="empty-note">Chưa có sản phẩm nào được đánh dấu bán chạy.</p>
        ) : bestSellers.map((p) => (
          <div className="quick-item" key={p.id}>
            <span>⭐ {p.name}</span>
            <strong>{formatPrice(p.price)}</strong>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;