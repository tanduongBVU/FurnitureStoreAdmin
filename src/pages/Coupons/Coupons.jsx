import { useState, useEffect } from "react";
import api from "../../services/Api";
import "./Coupons.css";

const emptyForm = {
  code: "",
  discountPercent: "",
  maxUsage: "",
  minOrderValue: "",
  expiryDate: "",
  isActive: true,
};

const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " ₫";
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get("/Coupons")
      .then((res) => setCoupons(res.data))
      .catch(() => setError("Không thể tải danh sách mã giảm giá."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      code: c.code,
      discountPercent: c.discountPercent,
      maxUsage: c.maxUsage ?? "",
      minOrderValue: c.minOrderValue ?? "",
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "",
      isActive: c.isActive,
    });
    setEditingId(c.id);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const payload = {
      code: form.code.trim(),
      discountPercent: Number(form.discountPercent),
      maxUsage: form.maxUsage === "" ? null : Number(form.maxUsage),
      minOrderValue: form.minOrderValue === "" ? null : Number(form.minOrderValue),
      expiryDate: form.expiryDate === "" ? null : new Date(form.expiryDate).toISOString(),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await api.put(`/Coupons/${editingId}`, { id: editingId, ...payload, usedCount: 0 });
      } else {
        await api.post("/Coupons", payload);
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá mã giảm giá này? Hành động không thể hoàn tác.")) return;
    try {
      await api.delete(`/Coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Xoá thất bại, vui lòng thử lại.");
    }
  };

  const statusOf = (c) => {
    if (!c.isActive) return { label: "Đã tắt", cls: "coupon-status--off" };
    if (c.expiryDate && new Date(c.expiryDate) < new Date()) return { label: "Hết hạn", cls: "coupon-status--expired" };
    if (c.maxUsage && c.usedCount >= c.maxUsage) return { label: "Hết lượt", cls: "coupon-status--expired" };
    return { label: "Đang hoạt động", cls: "coupon-status--active" };
  };

  return (
    <div className="coupons-admin-page">
      <div className="coupons-admin-header">
        <div>
          <h1>Mã giảm giá</h1>
          <p>Tạo và quản lý mã giảm giá áp dụng ở trang Thanh toán.</p>
        </div>
        <button className="coupons-admin-create-btn" onClick={openCreate}>
          + Tạo mã mới
        </button>
      </div>

      {error && <div className="coupons-admin-error">⚠️ {error}</div>}

      {loading ? (
        <p className="coupons-admin-loading">Đang tải...</p>
      ) : coupons.length === 0 ? (
        <div className="coupons-admin-empty">
          <span style={{ fontSize: 40 }}>🎟️</span>
          <p>Chưa có mã giảm giá nào.</p>
        </div>
      ) : (
        <table className="coupons-admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Giảm</th>
              <th>Đã dùng</th>
              <th>Đơn tối thiểu</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => {
              const status = statusOf(c);
              return (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discountPercent}%</td>
                  <td>{c.usedCount}{c.maxUsage ? ` / ${c.maxUsage}` : ""}</td>
                  <td>{c.minOrderValue ? formatPrice(c.minOrderValue) : "—"}</td>
                  <td>{formatDate(c.expiryDate)}</td>
                  <td><span className={`coupon-status ${status.cls}`}>{status.label}</span></td>
                  <td className="coupons-admin-actions">
                    <button onClick={() => openEdit(c)}>✏️</button>
                    <button onClick={() => handleDelete(c.id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="coupons-admin-modal-overlay" onClick={closeForm}>
          <div className="coupons-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</h2>
            <form onSubmit={handleSubmit}>
              {formError && <p className="coupons-admin-modal-error">⚠️ {formError}</p>}

              <div className="coupons-admin-field">
                <label>Mã giảm giá *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase())}
                  placeholder="VD: SALE10"
                  required
                />
              </div>

              <div className="coupons-admin-field">
                <label>Phần trăm giảm (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setField("discountPercent", e.target.value)}
                  required
                />
              </div>

              <div className="coupons-admin-field">
                <label>Số lần dùng tối đa</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsage}
                  onChange={(e) => setField("maxUsage", e.target.value)}
                  placeholder="Để trống = không giới hạn"
                />
              </div>

              <div className="coupons-admin-field">
                <label>Giá trị đơn tối thiểu (₫)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => setField("minOrderValue", e.target.value)}
                  placeholder="Để trống = không yêu cầu"
                />
              </div>

              <div className="coupons-admin-field">
                <label>Ngày hết hạn</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                />
              </div>

              <label className="coupons-admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                Kích hoạt mã này
              </label>

              <div className="coupons-admin-modal-actions">
                <button type="button" className="coupons-admin-cancel" onClick={closeForm}>Huỷ</button>
                <button type="submit" className="coupons-admin-save" disabled={saving}>
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;