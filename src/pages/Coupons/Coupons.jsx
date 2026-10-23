import { useState, useEffect } from "react";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, number, integer, minValue, maxValue, notPastDate, custom } from "../../utils/validators";
import "./Coupons.css";

const emptyForm = {
  code: "",
  discountPercent: "",
  maxUsage: "",
  minOrderValue: "",
  expiryDate: "",
  isActive: true,
};

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập.
// Ngày hết hạn chỉ cấm ở quá khứ khi TẠO MỚI; khi SỬA thì bỏ qua, để vẫn lưu được các thay đổi khác
// của một mã đã hết hạn mà không bị buộc đổi ngày.
const buildRules = (isEdit) => ({
  code: [
    required("Vui lòng nhập mã giảm giá."),
    custom((v) =>
      /^[A-Z0-9_-]{3,20}$/.test(String(v).trim())
        ? ""
        : "Mã gồm 3–20 ký tự: chữ in hoa, số, dấu - hoặc _ (VD: SALE10)."
    ),
  ],
  discountPercent: [
    required("Vui lòng nhập phần trăm giảm."),
    number("Phần trăm giảm phải là một con số."),
    integer("Phần trăm giảm phải là số nguyên."),
    minValue(1, "Phần trăm giảm tối thiểu là 1%."),
    maxValue(100, "Phần trăm giảm tối đa là 100%."),
  ],
  maxUsage: [
    integer("Số lần dùng phải là số nguyên."),
    minValue(1, "Số lần dùng tối thiểu là 1 (để trống nếu không giới hạn)."),
  ],
  minOrderValue: [
    number("Giá trị đơn tối thiểu phải là một con số."),
    minValue(0, "Giá trị đơn tối thiểu không được âm."),
  ],
  expiryDate: isEdit ? [] : [notPastDate("Ngày hết hạn không được ở trong quá khứ.")],
});

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
  const { errors, validateField, validateAll, clearError, setErrors } = useFormValidation(buildRules(Boolean(editingId)));

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

  // Gõ lại thì xoá lỗi của chính ô đó
  const setField = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    clearError(f);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setErrors({});
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
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validateAll(form)) return;

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
      const msg = err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      // Lỗi trùng mã → hiện ngay dưới ô "Mã giảm giá"; lỗi khác → banner phía trên form
      if (/tồn tại|đã có|trùng/i.test(msg)) {
        setErrors((prev) => ({ ...prev, code: msg }));
        const el = document.querySelector('[name="code"]');
        if (el) el.focus();
      } else {
        setFormError(msg);
      }
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
            <form onSubmit={handleSubmit} noValidate>
              {formError && <p className="coupons-admin-modal-error">⚠️ {formError}</p>}

              <div className="coupons-admin-field">
                <label>Mã giảm giá *</label>
                <input
                  type="text"
                  name="code"
                  className={errors.code ? "is-invalid" : ""}
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase())}
                  onBlur={() => validateField("code", form)}
                  placeholder="VD: SALE10"
                />
                <FieldError message={errors.code} />
              </div>

              <div className="coupons-admin-field">
                <label>Phần trăm giảm (%) *</label>
                <input
                  type="number"
                  name="discountPercent"
                  min="1"
                  max="100"
                  className={errors.discountPercent ? "is-invalid" : ""}
                  value={form.discountPercent}
                  onChange={(e) => setField("discountPercent", e.target.value)}
                  onBlur={() => validateField("discountPercent", form)}
                />
                <FieldError message={errors.discountPercent} />
              </div>

              <div className="coupons-admin-field">
                <label>Số lần dùng tối đa</label>
                <input
                  type="number"
                  name="maxUsage"
                  min="1"
                  className={errors.maxUsage ? "is-invalid" : ""}
                  value={form.maxUsage}
                  onChange={(e) => setField("maxUsage", e.target.value)}
                  onBlur={() => validateField("maxUsage", form)}
                  placeholder="Để trống = không giới hạn"
                />
                <FieldError message={errors.maxUsage} />
              </div>

              <div className="coupons-admin-field">
                <label>Giá trị đơn tối thiểu (₫)</label>
                <input
                  type="number"
                  name="minOrderValue"
                  min="0"
                  className={errors.minOrderValue ? "is-invalid" : ""}
                  value={form.minOrderValue}
                  onChange={(e) => setField("minOrderValue", e.target.value)}
                  onBlur={() => validateField("minOrderValue", form)}
                  placeholder="Để trống = không yêu cầu"
                />
                <FieldError message={errors.minOrderValue} />
              </div>

              <div className="coupons-admin-field">
                <label>Ngày hết hạn</label>
                <input
                  type="date"
                  name="expiryDate"
                  className={errors.expiryDate ? "is-invalid" : ""}
                  value={form.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                  onBlur={() => validateField("expiryDate", form)}
                />
                <FieldError message={errors.expiryDate} />
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