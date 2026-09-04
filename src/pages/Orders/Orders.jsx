import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
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

// Bỏ dấu tiếng Việt + khoảng trắng — dùng để tạo TÊN FILE an toàn, tránh vài hệ điều hành
// cũ hoặc phần mềm xử lý file bị lỗi với ký tự có dấu trong tên file.
const slugify = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const buildFilename = ({ statusFilter, dateFrom, dateTo, ext }) => {
  const parts = ["don-hang"];
  if (statusFilter !== "Tất cả") parts.push(slugify(statusFilter));
  if (dateFrom) parts.push(`tu-${dateFrom}`);
  if (dateTo) parts.push(`den-${dateTo}`);
  parts.push(new Date().toISOString().slice(0, 10));
  return `${parts.join("_")}.${ext}`;
};

// ── Xuất Excel (thư viện xlsx — thuần JS, không phụ thuộc React nên không lo xung đột version) ──
const exportExcel = (data, filename) => {
  const rows = data.map(o => ({
    "Mã đơn": `#${o.id}`,
    "Khách hàng": o.customerName,
    "Điện thoại": o.phone,
    "Địa chỉ": o.address || "",
    "Sản phẩm": o.orderItems?.map(i => `${i.productName} x${i.quantity}`).join(", ") || "",
    "Mã giảm giá": o.couponCode || "—",
    "Tổng tiền (₫)": o.total,
    "Trạng thái": o.status,
    "Ngày đặt": new Date(o.createdAt).toLocaleDateString("vi-VN"),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 32 },
    { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
  XLSX.writeFile(wb, filename);
};

// ── Xuất PDF (mở tab mới + gọi hộp thoại In của trình duyệt, chọn "Lưu thành PDF") ──
const exportPDF = (data, filename) => {
  const rows = data.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customerName || ""}<br/><span class="muted">${o.phone || ""}</span></td>
      <td>${o.orderItems?.map(i => `${i.productName} x${i.quantity}`).join(", ") || "—"}</td>
      <td>${o.couponCode || "—"}</td>
      <td class="num">${Number(o.total).toLocaleString("vi-VN")} ₫</td>
      <td>${new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
      <td>${o.status}</td>
    </tr>
  `).join("");

  const totalSum = data.reduce((s, o) => s + Number(o.total || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>${filename}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        p.meta { font-size: 12px; color: #64748b; margin: 0 0 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 7px 9px; text-align: left; vertical-align: top; }
        th { background: #f1f5f9; }
        .muted { color: #94a3b8; font-size: 11px; }
        .num { text-align: right; white-space: nowrap; }
        tfoot td { font-weight: 700; background: #f8fafc; }
        @media print { @page { size: A4 landscape; margin: 14mm; } }
      </style>
    </head>
    <body>
      <h1>Danh sách đơn hàng — LuxWood</h1>
      <p class="meta">Xuất lúc: ${new Date().toLocaleString("vi-VN")} — Tổng ${data.length} đơn</p>
      <table>
        <thead>
          <tr>
            <th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Mã giảm giá</th>
            <th>Tổng tiền</th><th>Ngày đặt</th><th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="4">Tổng cộng</td>
            <td class="num">${totalSum.toLocaleString("vi-VN")} ₫</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Trình duyệt đang chặn cửa sổ mới (popup). Vui lòng cho phép popup cho trang này rồi thử lại.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [exportAll, setExportAll] = useState(false); // true = xuất TOÀN BỘ, bỏ qua mọi bộ lọc kể cả ngày

  // Khoảng ngày — giờ là 1 điều kiện lọc CHUNG với Trạng thái + Tìm kiếm, áp dụng cho cả
  // bảng hiển thị bên dưới lẫn dữ liệu xuất file, không còn tách riêng như trước.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

    const created = new Date(o.createdAt);
    const matchDateFrom = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`);
    // Hết ngày đã chọn (23:59:59) — không bỏ sót đơn đặt trong chính ngày dateTo
    const matchDateTo = !dateTo || created <= new Date(`${dateTo}T23:59:59`);

    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // exportAll = bỏ qua MỌI bộ lọc (trạng thái, tìm kiếm, ngày) — đúng nghĩa "toàn bộ".
  // Không tick = dùng chung danh sách filtered với bảng, không tính lại riêng nữa.
  const getExportData = () => (exportAll ? orders : filtered);

  const handleExportExcel = () => {
    const data = getExportData();
    if (data.length === 0) { alert("Không có đơn hàng nào để xuất!"); return; }
    exportExcel(data, buildFilename({ statusFilter, dateFrom, dateTo, ext: "xlsx" }));
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (data.length === 0) { alert("Không có đơn hàng nào để xuất!"); return; }
    exportPDF(data, buildFilename({ statusFilter, dateFrom, dateTo, ext: "pdf" }));
  };

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

      {/* Bộ lọc ngày + Xuất dữ liệu */}
      <div
        style={{
          display: "flex", flexDirection: "column", gap: 12,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          padding: "12px 16px", marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={exportAll}
              onChange={e => setExportAll(e.target.checked)}
            />
            Xuất toàn bộ đơn hàng (bỏ qua mọi bộ lọc bên dưới, kể cả khoảng ngày)
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
            <span>Từ ngày</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 8px", fontSize: 13 }}
            />
            <span>đến</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 8px", fontSize: 13 }}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                style={{ border: "none", background: "none", color: "#dc2626", fontSize: 12, cursor: "pointer" }}
              >
                ✕ Xoá ngày
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button
              onClick={handleExportExcel}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#16a34a", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              📊 Xuất Excel
            </button>
            <button
              onClick={handleExportPDF}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              🖨️ Xuất PDF
            </button>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          {exportAll
            ? `Sẽ xuất TOÀN BỘ ${orders.length} đơn hàng, bỏ qua mọi bộ lọc.`
            : `Bảng đang hiển thị và sẽ xuất ${filtered.length} đơn hàng theo bộ lọc hiện tại.`}
        </p>
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