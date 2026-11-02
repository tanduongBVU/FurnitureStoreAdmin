import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/Api";
import { isAdmin } from "../../utils/permissions";
import "./Dashboard.css";

const STATUS_BADGE = {
  "Hoàn thành": "badge--success",
  "Đang xử lý": "badge--warning",
  "Đang giao": "badge--info",
  "Chờ xác nhận": "badge--warning",
  "Huỷ": "badge--danger",
};

// Màu badge theo mức ưu tiên của gợi ý hành động (AI)
const REC_BADGE = {
  "cao": "badge--danger",
  "trung bình": "badge--warning",
  "thấp": "badge--muted",
};

const formatPrice = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";
const formatDateShort = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
// Giờ:phút + ngày/tháng — dùng cho cột thời gian của đơn hàng và liên hệ
const formatDateTime = (d) =>
  new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

// Ngưỡng cảnh báo tồn kho: tồn ≤ ngưỡng này thì coi là "sắp hết" (0 là "hết hàng")
const LOW_STOCK_LIMIT = 3;
// Sản phẩm đăng chưa quá số ngày này thì chưa kết luận là "chưa bán được"
const NEW_PRODUCT_DAYS = 14;

// Gợi ý hành động của AI chỉ có chữ, nên đoán nút chuyển trang theo nội dung gợi ý.
// Không khớp từ khoá nào thì không hiện nút. Chỉ chuyển trang, không lọc sẵn.
const recAction = (r) => {
  const text = `${r.title || ""} ${r.detail || ""}`.toLowerCase();
  if (/liên hệ/.test(text)) return { to: "/contacts", label: "Xem liên hệ" };
  if (/đơn|xác nhận/.test(text)) return { to: "/orders", label: "Xem đơn hàng" };
  if (/hàng|kho|nhập|sản phẩm|combo|giảm giá|khuyến mãi/.test(text)) return { to: "/products", label: "Xem sản phẩm" };
  return null;
};
// Khoá ngày dạng yyyy-MM-dd (theo giờ máy) — khớp với trường "date" Backend trả về ở /Dashboard/anomalies
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
  // Admin (giám đốc) thấy đầy đủ; Nhân viên chỉ thấy phần "việc cần làm" — ẩn doanh thu, biểu đồ, AI.
  const admin = isAdmin();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Số ngày hiển thị trong biểu đồ doanh thu — khách Admin tự chọn 7 / 14 / 30 ngày gần nhất
  const [chartRange, setChartRange] = useState(14);
  // Giữ trang ngắn: gợi ý AI mặc định chỉ hiện 3 dòng đầu, phân tích sản phẩm gộp vào 1 khung có tab
  const [recExpanded, setRecExpanded] = useState(false);
  const [analysisTab, setAnalysisTab] = useState("category"); // "category" | "ranking" | "never"

  // ── Nhận xét nhanh bằng AI (Gemini) — xem DashboardController.GetInsights. KHÔNG dùng AI
  // để tính số liệu, chỉ nhờ AI đọc số liệu đã tính sẵn ở Backend rồi viết nhận xét ngắn.
  // Gọi lại mỗi khi đổi khoảng ngày của biểu đồ (chartRange), để nhận xét luôn khớp đúng
  // khoảng thời gian Admin đang xem trên biểu đồ.
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState("");
  // Mặc định chỉ hiện 2 dòng đầu (banner gọn) — Admin bấm "Xem thêm" mới hiện trọn vẹn
  const [insightExpanded, setInsightExpanded] = useState(false);

  // ── Gợi ý hành động bằng AI — xem DashboardController.GetRecommendations.
  // Chỉ gọi 1 lần khi mở trang, KHÔNG phụ thuộc chartRange vì gợi ý hành động không gắn
  // với khoảng ngày đang xem ở biểu đồ.
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");

  // ── Ngày doanh thu bất thường trên biểu đồ — xem DashboardController.GetAnomalies.
  // Backend tự phát hiện bằng code (không để AI đoán), AI chỉ viết lời giải thích.
  // Gọi lại mỗi khi đổi chartRange để khớp đúng khoảng ngày đang xem.
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [anomalyError, setAnomalyError] = useState("");
  const [selectedAnomaly, setSelectedAnomaly] = useState(null); // khoá ngày yyyy-MM-dd đang được chọn

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

  useEffect(() => {
    if (!admin) return; // nhân viên không gọi API AI
    let cancelled = false;
    setInsightLoading(true);
    setInsightError("");
    setInsightExpanded(false);
    api.get(`/Dashboard/insights?days=${chartRange}`)
      .then(res => {
        if (!cancelled) setInsight(res.data.summary);
      })
      .catch(() => {
        if (!cancelled) setInsightError("Chưa thể lấy nhận xét từ AI lúc này — kiểm tra lại cấu hình Gemini API Key ở Backend, hoặc thử tải lại trang.");
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });
    return () => { cancelled = true; };
  }, [chartRange, admin]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    setRecLoading(true);
    setRecError("");
    api.get("/Dashboard/recommendations")
      .then(res => {
        if (!cancelled) setRecommendations(res.data.recommendations || []);
      })
      .catch(() => {
        if (!cancelled) setRecError("Chưa thể lấy gợi ý từ AI lúc này — kiểm tra lại cấu hình Gemini API Key ở Backend, hoặc thử tải lại trang.");
      })
      .finally(() => {
        if (!cancelled) setRecLoading(false);
      });
    return () => { cancelled = true; };
  }, [admin]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    setAnomalyLoading(true);
    setAnomalyError("");
    setSelectedAnomaly(null);
    api.get(`/Dashboard/anomalies?days=${chartRange}`)
      .then(res => {
        if (!cancelled) setAnomalies(res.data.anomalies || []);
      })
      .catch(() => {
        if (!cancelled) setAnomalyError("Chưa kiểm tra được điểm bất thường lúc này.");
      })
      .finally(() => {
        if (!cancelled) setAnomalyLoading(false);
      });
    return () => { cancelled = true; };
  }, [chartRange, admin]);

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
  // Sản phẩm sắp hết VÀ đã hết hàng (tồn ≤ ngưỡng), ít tồn nhất lên đầu
  const lowStockAll = activeProducts
    .filter(p => p.stock <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.stock - b.stock);
  const lowStock = lowStockAll.slice(0, 5);

  // ── Liên hệ ──
  const newContacts = contacts.filter(c => c.status === "Mới");
  const contactsThisMonth = contacts.filter(c => isSameMonth(c.createdAt, now)).length;
  const contactsLastMonth = contacts.filter(c => isSameMonth(c.createdAt, lastMonthRef)).length;
  const contactsDelta = contactsThisMonth - contactsLastMonth;

  // ── Giá trị đơn hàng trung bình (AOV) — chỉ tính đơn Hoàn thành, so sánh tháng này với tháng trước ──
  const completedThisMonth = completedOrders.filter(o => isSameMonth(o.createdAt, now));
  const completedLastMonthList = completedOrders.filter(o => isSameMonth(o.createdAt, lastMonthRef));
  const aovThisMonth = completedThisMonth.length > 0 ? revenueThisMonth / completedThisMonth.length : 0;
  const aovLastMonth = completedLastMonthList.length > 0 ? revenueLastMonth / completedLastMonthList.length : 0;
  const aovChange = pctChange(aovThisMonth, aovLastMonth);

  // ── Tỷ lệ đơn huỷ — trên TỔNG số đơn phát sinh trong tháng (không chỉ đơn Hoàn thành) ──
  const cancelledThisMonth = orders.filter(o => o.status === "Huỷ" && isSameMonth(o.createdAt, now)).length;
  const cancelledLastMonth = orders.filter(o => o.status === "Huỷ" && isSameMonth(o.createdAt, lastMonthRef)).length;
  const cancellationRateThisMonth = ordersThisMonth > 0 ? (cancelledThisMonth / ordersThisMonth) * 100 : 0;
  const cancellationRateLastMonth = ordersLastMonth > 0 ? (cancelledLastMonth / ordersLastMonth) * 100 : 0;
  // Chênh lệch tính theo ĐIỂM PHẦN TRĂM (hiệu số trực tiếp), KHÔNG dùng pctChange — vì đây đã
  // là 1 tỷ lệ % rồi, lấy % thay đổi của 1 con số % sẽ gây hiểu lầm (VD: từ 2% lên 4% là
  // "tăng 100%" theo pctChange, trong khi thực chất chỉ tăng 2 điểm %, dễ gây hoảng khi đọc).
  const cancellationChange = cancellationRateThisMonth - cancellationRateLastMonth;

  const stats = [
    {
      label: "Tổng doanh thu (đơn Hoàn thành)", value: formatPrice(totalRevenue),
      change: `Tháng này ${formatPrice(revenueThisMonth)} (${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% so với tháng trước)`,
      up: revenueChange >= 0, icon: "💰", color: "#4f72e3",
    },
    {
      label: "Đơn hàng tháng này", value: String(ordersThisMonth),
      change: `${ordersChange >= 0 ? "+" : ""}${ordersChange.toFixed(1)}% so với tháng trước`,
      up: ordersChange >= 0, icon: "📦", color: "#22c55e", to: "/orders",
    },
    {
      label: "Sản phẩm đang bán", value: String(activeProducts.length),
      change: `+${newProductsThisMonth} mới trong tháng`,
      up: true, icon: "🪑", color: "#f59e0b", to: "/products",
    },
    {
      label: "Liên hệ chưa xử lý", value: String(newContacts.length),
      change: `${contactsDelta >= 0 ? "+" : ""}${contactsDelta} so với tháng trước`,
      up: contactsDelta <= 0, icon: "✉️", color: "#ef4444", to: "/contacts",
    },
    {
      label: "Giá trị đơn TB (tháng này)", value: formatPrice(aovThisMonth),
      change: `${aovChange >= 0 ? "+" : ""}${aovChange.toFixed(1)}% so với tháng trước`,
      up: aovChange >= 0, icon: "🧾", color: "#0ea5e9",
    },
    {
      label: "Tỷ lệ đơn huỷ (tháng này)", value: `${cancellationRateThisMonth.toFixed(1)}%`,
      change: `${cancellationChange >= 0 ? "+" : ""}${cancellationChange.toFixed(1)} điểm % so với tháng trước`,
      up: cancellationChange <= 0, icon: "❌", color: "#dc2626", to: "/orders",
    },
  ];

  // Thẻ số liệu cho NHÂN VIÊN: chỉ "việc cần làm" (không có doanh thu / giá trị đơn TB / tỷ lệ huỷ)
  const pendingOrdersCount = orders.filter(o => o.status === "Chờ xác nhận").length;
  const processingOrdersCount = orders.filter(o => o.status === "Đang xử lý").length;
  const staffStats = [
    {
      label: "Đơn chờ xác nhận", value: String(pendingOrdersCount),
      change: pendingOrdersCount > 0 ? "Cần xử lý ngay" : "Đã xử lý hết",
      up: pendingOrdersCount === 0, icon: "⏳", color: "#f59e0b", to: "/orders",
    },
    {
      label: "Đơn đang xử lý", value: String(processingOrdersCount),
      change: "Đã xác nhận, chưa hoàn thành",
      up: true, icon: "🛠️", color: "#0ea5e9", to: "/orders",
    },
    {
      label: "Liên hệ chưa xử lý", value: String(newContacts.length),
      change: newContacts.length > 0 ? "Cần phản hồi" : "Đã xử lý hết",
      up: newContacts.length === 0, icon: "✉️", color: "#ef4444", to: "/contacts",
    },
    {
      label: "Sản phẩm sắp hết / hết hàng", value: String(lowStockAll.length),
      change: lowStockAll.length > 0 ? `Tồn từ ${LOW_STOCK_LIMIT} trở xuống` : "Tồn kho ổn",
      up: lowStockAll.length === 0, icon: "📉", color: "#d97706", to: "/products",
    },
  ];
  // Khu "Công việc cần xử lý" của nhân viên: mỗi dòng dẫn tới trang xử lý tương ứng
  const staffTasks = [
    { label: "Đơn hàng chờ xác nhận", count: pendingOrdersCount, to: "/orders", action: "Xem đơn hàng" },
    { label: "Liên hệ mới chưa phản hồi", count: newContacts.length, to: "/contacts", action: "Xem liên hệ" },
    { label: "Sản phẩm sắp hết hoặc hết hàng", count: lowStockAll.length, to: "/products", action: "Xem sản phẩm" },
  ];
  const visibleStats = admin ? stats : staffStats;

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
  const rangeTotal = chartData.reduce((s, d) => s + d.total, 0);

  // ── Đơn hàng: Admin xem 5 đơn gần nhất; Nhân viên thấy đơn "Chờ xác nhận" lên đầu ──
  const orderPriority = (o) => (o.status === "Chờ xác nhận" ? 1 : 0);
  const recentOrders = [...orders]
    .sort((a, b) =>
      (admin ? 0 : orderPriority(b) - orderPriority(a)) ||
      new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);


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

  // ── 3. Sản phẩm ĐANG BÁN nhưng CHƯA TỪNG có lượt bán nào (0 lượt, kể cả sản phẩm đã
  // đăng lâu) — khác hẳn "bán chậm nhất" ở trên (worstSelling chỉ xét sản phẩm ĐÃ có bán).
  // Đây là danh sách để Admin cân nhắc: cần quảng bá thêm, giảm giá, hay ngừng nhập nữa. ──
  const neverSoldProducts = activeProducts.filter(p => !soldQtyByProduct[p.id]);
  const isNewProduct = (p) => p.createdAt && (now - new Date(p.createdAt)) < NEW_PRODUCT_DAYS * 86400000;

  // Tra nhanh ngày bất thường theo khoá yyyy-MM-dd để đánh dấu cột trên biểu đồ
  const anomalyByDate = Object.fromEntries(anomalies.map(a => [a.date, a]));

  return (
    <div className="dashboard">
      <div className="dashboard-layout">

        {/* ── Cột trái: số liệu, biểu đồ, phân tích, đơn hàng ── */}
        <div className="dashboard-main">
      {admin && (<>
      {/* ── Nhận xét nhanh bằng AI — đặt TRÊN CÙNG, trước cả số liệu, để Admin đọc nhận
          định tổng quan trước khi nhìn vào từng con số. Thiết kế dạng banner GỌN: nền nhạt
          tách biệt hẳn khỏi các dashboard-card trắng bên dưới, mặc định chỉ hiện 2 dòng kèm
          nút "Xem thêm" thay vì chiếm nguyên 1 khối to như trước — Admin bận thì lướt qua 2
          dòng đầu là đủ, cần đọc kỹ thì bấm mở rộng. Luôn hiện khối này kể cả khi lỗi, để
          Admin biết tính năng tồn tại thay vì âm thầm ẩn đi khi Gemini gặp sự cố. */}
      <div
        style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
          border: "1px solid #c7d2fe", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 19, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>🤖</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: .4 }}>
            Nhận xét nhanh (AI)
            <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "#6366f1", marginLeft: 6 }}>
              · dựa trên số liệu tháng này và {chartRange} ngày gần nhất
            </span>
          </p>
          {insightLoading ? (
            <p style={{ margin: 0, fontSize: 13.5, color: "#6366f1" }}>Đang phân tích số liệu...</p>
          ) : insightError ? (
            <p style={{ margin: 0, fontSize: 13.5, color: "#dc2626" }}>{insightError}</p>
          ) : (
            <>
              <p
                style={{
                  margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#312e81",
                  display: insightExpanded ? "block" : "-webkit-box",
                  WebkitLineClamp: insightExpanded ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: insightExpanded ? "visible" : "hidden",
                }}
              >
                {insight}
              </p>
              <button
                onClick={() => setInsightExpanded((e) => !e)}
                style={{
                  marginTop: 4, background: "none", border: "none", padding: 0,
                  fontSize: 12, fontWeight: 600, color: "#4338ca", cursor: "pointer",
                }}
              >
                {insightExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
              </button>
            </>
          )}
        </div>
      </div>

      </>)}

      {/* Stats */}
      <div className="stats-grid">
        {visibleStats.map((s, i) => {
          const body = (
            <>
              <div className="stat-card__icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
              <div className="stat-card__info">
                <p className="stat-card__label">{s.label}</p>
                <h3 className="stat-card__value">{s.value}</h3>
                <span className={`stat-card__change ${s.up ? "up" : "down"}`}>
                  {s.up ? "↑" : "↓"} {s.change}
                </span>
              </div>
            </>
          );
          // Thẻ có "to" bấm được để chuyển sang trang quản lý tương ứng
          return s.to
            ? <Link to={s.to} className="stat-card stat-card--link" key={i}>{body}</Link>
            : <div className="stat-card" key={i}>{body}</div>;
        })}
      </div>

      {admin && (<>
      {/* Revenue chart */}
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <div>
            <h2>Doanh thu {chartRange} ngày gần nhất</h2>
            <p className="chart-note chart-note--sub">
              Tổng: <strong>{formatPrice(rangeTotal)}</strong> · tính theo ngày đặt hàng, không gồm đơn đã huỷ
            </p>
          </div>
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
              const key = dateKey(d.date);
              const anomaly = anomalyByDate[key];
              return (
                <div
                  className={`revenue-bar-col ${anomaly ? "revenue-bar-col--clickable" : ""}`}
                  key={i}
                  onClick={anomaly ? () => setSelectedAnomaly(selectedAnomaly === key ? null : key) : undefined}
                >
                  {anomaly && <span className="revenue-bar-flag" title="Ngày doanh thu bất thường — bấm để xem giải thích">⚠</span>}
                  <div className="revenue-bar-track">
                    <div
                      className={`revenue-bar ${anomaly ? "revenue-bar--anomaly" : ""} ${selectedAnomaly === key ? "revenue-bar--selected" : ""}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${formatDateShort(d.date)}: ${formatPrice(d.total)}${anomaly ? " (bất thường)" : ""}`}
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

        {/* ── Ghi chú điểm bất thường dưới biểu đồ — phát hiện bằng code, AI chỉ giải thích.
            Luôn hiện 1 dòng trạng thái để Admin biết tính năng tồn tại. ── */}
        {hasChartData && (
          anomalyLoading ? (
            <p className="anomaly-status">🔎 Đang kiểm tra điểm bất thường...</p>
          ) : anomalyError ? (
            <p className="anomaly-status">{anomalyError}</p>
          ) : anomalies.length === 0 ? (
            <p className="anomaly-status">✅ Không phát hiện ngày nào có doanh thu bất thường trong {chartRange} ngày qua.</p>
          ) : (
            <div className="anomaly-list">
              {anomalies.map((a) => (
                <div
                  key={a.date}
                  className={`anomaly-item ${selectedAnomaly === a.date ? "anomaly-item--selected" : ""}`}
                  onClick={() => setSelectedAnomaly(selectedAnomaly === a.date ? null : a.date)}
                >
                  <p className="anomaly-item__title">
                    ⚠ Ngày {formatDateShort(a.date + "T00:00:00")} — {formatPrice(a.total)}
                    <span className="anomaly-item__ratio">gấp {a.ratio} lần mức thường</span>
                  </p>
                  <p className="anomaly-item__text">{a.explanation}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Phân tích sản phẩm: gộp doanh thu theo danh mục, bán chạy/chậm, chưa bán được vào 1 khung có tab ── */}
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Phân tích sản phẩm</h2>
          <div className="chart-range-toggle">
            {[
              ["category", "Theo danh mục"],
              ["ranking", "Bán chạy / bán chậm"],
              ["never", `Chưa bán được (${neverSoldProducts.length})`],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`chart-range-btn ${analysisTab === key ? "chart-range-btn--active" : ""}`}
                onClick={() => setAnalysisTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {analysisTab === "category" && (
          categoryStats.length === 0 ? (
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
                      <div className="category-revenue-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {analysisTab === "ranking" && (
          productSalesRanking.length === 0 ? (
            <p className="empty-note">Chưa có sản phẩm nào được bán (đơn Hoàn thành).</p>
          ) : (
            <div className="ranking-columns">
              <div className="ranking-col">
                <p className="ranking-col__title">🔥 Bán chạy nhất (theo số lượng)</p>
                {topSelling.map((p, i) => (
                  <div className="ranking-item" key={p.id}>
                    <span className="ranking-item__rank">{i + 1}</span>
                    <span className="ranking-item__name">{p.name}</span>
                    <strong>{p.qty} đã bán</strong>
                  </div>
                ))}
              </div>
              <div className="ranking-col">
                <p className="ranking-col__title">🐌 Bán chậm nhất (đã có ít nhất 1 lượt bán)</p>
                {worstSelling.map((p, i) => (
                  <div className="ranking-item" key={p.id}>
                    <span className="ranking-item__rank">{i + 1}</span>
                    <span className="ranking-item__name">{p.name}</span>
                    <strong>{p.qty} đã bán</strong>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {analysisTab === "never" && (
          neverSoldProducts.length === 0 ? (
            <p className="empty-note">🎉 Mọi sản phẩm đang bán đều đã có ít nhất 1 lượt bán.</p>
          ) : (
            <>
              {neverSoldProducts.slice(0, 5).map((p) => (
                <div className="quick-item" key={p.id}>
                  <span>📦 {p.name} — {p.category || "Chưa phân loại"}</span>
                  {/* Sản phẩm mới đăng chưa nên coi là ế */}
                  <span className="badge badge--muted">{isNewProduct(p) ? "Mới đăng" : "Chưa bán được"}</span>
                </div>
              ))}
              {neverSoldProducts.length > 5 && (
                <p className="empty-note" style={{ marginTop: 8 }}>
                  ...và {neverSoldProducts.length - 5} sản phẩm khác
                </p>
              )}
            </>
          )
        )}
      </div>

      </>)}

      {/* Recent Orders */}
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>{admin ? "Đơn hàng gần đây" : "Đơn hàng cần xử lý (đơn chờ xác nhận xếp trước)"}</h2>
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
                  <th>Thời gian đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.customerName}</td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || "badge--info"}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

        </div>

        {/* ── Cột phải: việc cần làm, gợi ý AI, tồn kho, liên hệ ── */}
        <aside className="dashboard-side">
      {/* ── Việc cần làm (cả Admin và Nhân viên): mỗi dòng dẫn tới trang xử lý tương ứng ── */}
      {(
        <div className="dashboard-card">
          <div className="dashboard-card__header"><h2>📋 Việc cần làm</h2></div>
          {staffTasks.every(task => task.count === 0) ? (
            <p className="empty-note">🎉 Hiện không có việc nào cần xử lý.</p>
          ) : (
            staffTasks.map((task) => (
              <div className="task-item" key={task.label}>
                <span className={`badge ${task.count > 0 ? "badge--warning" : "badge--muted"}`}>{task.count}</span>
                <span className="task-item__label">{task.label}</span>
                {task.count > 0 && <Link to={task.to} className="task-item__action">{task.action} →</Link>}
              </div>
            ))
          )}
        </div>
      )}

      {admin && (<>
      {/* ── Gợi ý hành động bằng AI — Admin nên làm gì ngay, kèm mức ưu tiên.
          Rỗng thì vẫn hiện thông báo thay vì ẩn card, để Admin biết tính năng tồn tại. */}
      <div className="dashboard-card">
        <div className="dashboard-card__header"><h2>💡 Gợi ý hành động (AI)</h2></div>
        {recLoading ? (
          <p className="empty-note">Đang phân tích số liệu...</p>
        ) : recError ? (
          <p className="empty-note" style={{ color: "#dc2626" }}>{recError}</p>
        ) : recommendations.length === 0 ? (
          <p className="empty-note">Hiện chưa có gợi ý hành động nào.</p>
        ) : (
          <>{(recExpanded ? recommendations : recommendations.slice(0, 3)).map((r, i) => {
            const act = recAction(r);
            return (
              <div className="rec-item" key={i}>
                <span className={`badge ${REC_BADGE[r.priority] || "badge--info"}`}>{r.priority}</span>
                <div className="rec-item__body">
                  <strong>{r.title}</strong>
                  {r.detail && <p>{r.detail}</p>}
                </div>
                {act && <Link to={act.to} className="rec-item__action">{act.label} →</Link>}
              </div>
            );
          })}
          {recommendations.length > 3 && (
            <button className="rec-toggle" onClick={() => setRecExpanded((v) => !v)}>
              {recExpanded ? "Thu gọn ▲" : `Xem thêm ${recommendations.length - 3} gợi ý ▼`}
            </button>
          )}
          </>
        )}
      </div>

      </>)}

        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Sản phẩm sắp hết / hết hàng ({lowStockAll.length})</h2>
            <Link to="/products" className="view-all">Xem sản phẩm →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="empty-note">Không có sản phẩm nào sắp hết hàng.</p>
          ) : lowStock.map((p) => (
            <div className="quick-item" key={p.id}>
              <span>🪑 {p.name} — {p.stock === 0 ? "hết hàng" : `còn ${p.stock}`}</span>
              <span className={`badge ${p.stock === 0 ? "badge--danger" : "badge--warning"}`}>
                {p.stock === 0 ? "Hết hàng" : "Sắp hết"}
              </span>
            </div>
          ))}
          {lowStockAll.length > lowStock.length && (
            <p className="empty-note">...và {lowStockAll.length - lowStock.length} sản phẩm khác</p>
          )}
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Liên hệ chưa xử lý ({newContacts.length})</h2>
            <Link to="/contacts" className="view-all">Xem tất cả →</Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="empty-note">Không có liên hệ mới nào.</p>
          ) : recentContacts.map((c) => {
            const msg = (c.message || "").trim();
            return (
              <div className="quick-item" key={c.id}>
                <span>
                  ✉️ <strong>{c.name || "Khách"}</strong> — {msg ? (msg.length > 32 ? msg.slice(0, 32) + "..." : msg) : "(không có nội dung)"}
                </span>
                <span className="quick-item__meta">{formatDateTime(c.createdAt)}</span>
              </div>
            );
          })}
        </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;