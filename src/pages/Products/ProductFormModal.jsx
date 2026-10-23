import { useState, useEffect, Fragment } from "react";
import api from "../../services/Api";
import ImageUploadInput, { MultiImageUploadButton } from "../../components/ImageUploadInput/ImageUploadInput";
import RichTextEditor, { isRichTextEmpty } from "../../components/RichTextEditor/RichTextEditor";
import Modal from "../../components/Modal/Modal";
import FieldError from "../../components/FieldError/FieldError";
import useFormValidation from "../../hooks/useFormValidation";
import { required, number, integer, positive, minValue, maxValue, minLength, maxLength, imagePath, imageList } from "../../utils/validators";
import "./ProductForm.css";

const CATEGORIES = ["Phòng khách", "Phòng ngủ", "Phòng ăn", "Phòng làm việc", "Phòng tắm", "Ban công"];
const MATERIALS = ["Gỗ tự nhiên", "Gỗ công nghiệp", "Kim loại", "Vải nỉ", "Da/Da công nghiệp", "Mây tre đan", "Kính"];
const COLORS = ["Nâu gỗ", "Trắng", "Đen", "Xám", "Be/Kem", "Xanh dương", "Xanh lá", "Vàng"];
const EMPTY_FORM = {
  name: "", category: "Phòng khách", price: "", stock: "", description: "", image: "",
  detailContent: "", // "Thông tin chi tiết" — HTML từ trình soạn thảo (chữ, bảng, ảnh, link...)
  imagesText: "", // ảnh phụ, mỗi dòng 1 URL (tối đa 4 dòng) — nối thành chuỗi phân tách dấu phẩy khi lưu
  isBestSeller: false, discountPercent: 0,
  material: MATERIALS[0], color: COLORS[0],
};
const MAX_EXTRA_IMAGES = 4;

// Luật kiểm tra từng ô — lỗi hiện chữ đỏ ngay dưới ô nhập
const RULES = {
  name: [
    required("Vui lòng nhập tên sản phẩm."),
    minLength(2, "Tên sản phẩm cần ít nhất 2 ký tự."),
    maxLength(200, "Tên sản phẩm tối đa 200 ký tự."),
  ],
  price: [
    required("Vui lòng nhập giá."),
    number("Giá phải là một con số."),
    positive("Giá phải lớn hơn 0."),
  ],
  stock: [
    required("Vui lòng nhập tồn kho."),
    integer("Tồn kho phải là số nguyên."),
    minValue(0, "Tồn kho không được âm."),
  ],
  discountPercent: [
    number("Giảm giá phải là một con số."),
    minValue(0, "Giảm giá không được âm."),
    maxValue(100, "Giảm giá tối đa 100%."),
  ],
  description: [maxLength(5000, "Mô tả tối đa 5000 ký tự.")],
  image: [imagePath()],
  imagesText: [imageList()],
};

// Kiểm tra từng dòng biến thể → mảng thông báo lỗi (chuỗi rỗng = dòng hợp lệ)
const validateVariants = (list) =>
  list.map((v, i) => {
    const msgs = [];
    if (String(v.price).trim() === "" || !(Number(v.price) > 0)) msgs.push("giá phải lớn hơn 0");
    if (String(v.stock).trim() === "") msgs.push("vui lòng nhập tồn kho");
    else if (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0) msgs.push("tồn kho phải là số nguyên không âm");
    if (list.findIndex((o) => o.material === v.material && o.color === v.color) !== i)
      msgs.push("trùng chất liệu + màu với một biến thể phía trên");
    return msgs.length ? `Biến thể ${i + 1}: ${msgs.join("; ")}.` : "";
  });
const variantPriceBad = (v) => !(Number(v.price) > 0);
const variantStockBad = (v) =>
  String(v.stock).trim() === "" || !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0;

// Chuỗi phân tách dấu phẩy (từ Backend) → text mỗi dòng 1 URL (hiện trong textarea)
const imagesToText = (images) =>
  (images || "").split(",").map((u) => u.trim()).filter(Boolean).join("\n");
// Text mỗi dòng 1 URL (textarea) → mảng URL, cắt tối đa 4 ảnh
const parseImagesText = (text) =>
  text.split("\n").map((u) => u.trim()).filter(Boolean).slice(0, MAX_EXTRA_IMAGES);
// Text mỗi dòng 1 URL → chuỗi phân tách dấu phẩy để gửi lên Backend
const imagesTextToPayload = (text) => parseImagesText(text).join(",");

const ProductFormModal = ({ productId = null, onClose, onSaved }) => {
  const isEdit = productId !== null;
  const [form, setForm] = useState(isEdit ? null : EMPTY_FORM);
  const [variants, setVariants] = useState([]); // [{ id?, material, color, price, stock }]
  const [variantErrors, setVariantErrors] = useState([]); // thông báo lỗi theo từng dòng biến thể
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { errors, validateField, validateAll, clearError } = useFormValidation(RULES);

  // Hiện lỗi chung ở đầu form và cuộn lên đó (vùng nội dung của popup tự cuộn riêng)
  const showError = (msg) => {
    setError(msg);
    document.querySelector(".lx-modal-body")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Gõ lại thì xoá lỗi của chính ô đó
  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    clearError(f);
  };

  // Ảnh phụ vừa tải lên từ máy → nối thêm vào cuối danh sách hiện có, cắt tối đa 4 ảnh
  // và báo cho người dùng biết nếu có ảnh bị bỏ bớt do vượt giới hạn.
  const appendExtraImages = (urls) => {
    setForm((p) => {
      const existing = parseImagesText(p.imagesText || "");
      const combined = [...existing, ...urls];
      if (combined.length > MAX_EXTRA_IMAGES) {
        alert(`Chỉ được tối đa ${MAX_EXTRA_IMAGES} ảnh phụ — đã tự động giữ lại ${MAX_EXTRA_IMAGES} ảnh đầu tiên.`);
      }
      return { ...p, imagesText: combined.slice(0, MAX_EXTRA_IMAGES).join("\n") };
    });
    clearError("imagesText");
  };

  // Chế độ SỬA: tải sản phẩm hiện có
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/Products/${productId}`)
      .then(res => {
        setForm({ discountPercent: 0, ...res.data, imagesText: imagesToText(res.data.images) });
        setVariants(
          (res.data.variants || []).map(v => ({
            id: v.id,
            material: v.material || MATERIALS[0],
            color: v.color || COLORS[0],
            price: String(v.price),
            stock: String(v.stock),
          }))
        );
      })
      .catch(() => setError("Không tìm thấy sản phẩm!"))
      .finally(() => setLoading(false));
  }, [productId, isEdit]);

  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const baseStock = Number(form?.stock) || 0;
  const stockExceeded = hasVariants && totalVariantStock > baseStock;

  const addVariantRow = () => setVariants(prev => [...prev, { material: MATERIALS[0], color: COLORS[0], price: "", stock: "" }]);
  const removeVariantRow = (idx) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
    setVariantErrors([]); // chỉ số dòng bị lệch sau khi xoá → xoá hết thông báo cũ, bấm lưu sẽ kiểm tra lại
  };
  const setVariantField = (idx, field, value) => {
    setVariants(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
    setVariantErrors(prev => prev.map((m, i) => (i === idx ? "" : m)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setError("");

    const fieldsOk = validateAll(form);
    const vErrs = validateVariants(variants);
    setVariantErrors(vErrs);
    if (!fieldsOk || vErrs.some(Boolean)) return;

    if (stockExceeded) {
      showError(`Tổng tồn kho các biến thể (${totalVariantStock}) không được vượt quá tồn kho tổng (${baseStock}).`);
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      images: imagesTextToPayload(form.imagesText || ""),
      // Trình soạn thảo để trống vẫn trả "<p><br></p>" → quy về chuỗi rỗng khi không có nội dung thật
      detailContent: isRichTextEmpty(form.detailContent) ? "" : form.detailContent,
      price: Number(form.price),
      stock: Number(form.stock),
      discountPercent: Number(form.discountPercent) || 0,
      // Có biến thể thì KHÔNG gửi material/color gốc nữa (mỗi biến thể tự có riêng)
      material: hasVariants ? null : form.material,
      color: hasVariants ? null : form.color,
      variants: variants.map(v => ({
        material: v.material,
        color: v.color,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) await api.put(`/Products/${productId}`, payload);
      else await api.post("/Products", payload);
      onSaved();
    } catch (err) {
      showError(err.response?.data?.message || (isEdit
        ? "Lỗi khi cập nhật sản phẩm! Kiểm tra lại backend."
        : "Lỗi khi thêm sản phẩm! Kiểm tra lại backend."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="md"
      title={isEdit ? `Sửa sản phẩm #${productId}` : "Thêm sản phẩm mới"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="lx-modal-btn lx-modal-btn--ghost" onClick={onClose}>Huỷ</button>
          <button
            type="submit"
            form="product-form"
            className="lx-modal-btn lx-modal-btn--primary"
            disabled={saving || loading || !form || stockExceeded}
          >
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
      ) : !form ? (
        <div className="form-error">⚠️ {error || "Không tìm thấy sản phẩm!"}</div>
      ) : (
        <>
          {error && <div className="form-error">⚠️ {error}</div>}
          <form id="product-form" onSubmit={handleSubmit} noValidate>

          <div className="form-section">
            <h3>Thông tin cơ bản</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="name">Tên sản phẩm *</label>
                <input
                  id="name"
                  name="name"
                  className={errors.name ? "is-invalid" : ""}
                  value={form.name || ""}
                  onChange={e => set("name", e.target.value)}
                  onBlur={() => validateField("name", form)}
                  placeholder="VD: Sofa Bắc Âu Oslo"
                />
                <FieldError message={errors.name} />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh mục *</label>
                <select id="category" name="category" value={form.category || ""} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {!hasVariants && (
                <>
                  <div className="form-group">
                    <label htmlFor="material">Chất liệu</label>
                    <select id="material" name="material" value={form.material || MATERIALS[0]} onChange={e => set("material", e.target.value)}>
                      {MATERIALS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="color">Màu sắc</label>
                    <select id="color" name="color" value={form.color || COLORS[0]} onChange={e => set("color", e.target.value)}>
                      {COLORS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="price">Giá (₫) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  className={errors.price ? "is-invalid" : ""}
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  onBlur={() => validateField("price", form)}
                  placeholder="VD: 18500000"
                />
                <FieldError message={errors.price} />
                {hasVariants && (
                  <span className="settings-field-hint">
                    Sản phẩm đang có biến thể — giá này KHÔNG dùng để bán, Client hiện giá của từng biến thể bên dưới.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="stock">Tồn kho tổng *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  className={errors.stock ? "is-invalid" : ""}
                  value={form.stock}
                  onChange={e => set("stock", e.target.value)}
                  onBlur={() => validateField("stock", form)}
                  placeholder="VD: 10"
                />
                <FieldError message={errors.stock} />
                {hasVariants && (
                  <span className={`settings-field-hint ${stockExceeded ? "hint-error" : ""}`}>
                    Tổng tồn kho các biến thể: {totalVariantStock} / {baseStock || 0}
                    {stockExceeded && " — VƯỢT QUÁ giới hạn!"}
                  </span>
                )}
              </div>
              <div className="form-group full">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={errors.description ? "is-invalid" : ""}
                  value={form.description || ""}
                  onChange={e => set("description", e.target.value)}
                  onBlur={() => validateField("description", form)}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
                <FieldError message={errors.description} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Thông tin chi tiết (không bắt buộc)</h3>
            <p className="settings-field-hint" style={{ marginBottom: 10 }}>
              Hiện thành mục "Thông tin chi tiết" ở trang sản phẩm — có thể chèn chữ định dạng, bảng thông số, ảnh, link.
              Để trống nếu không cần, mục này sẽ không hiện.
            </p>
            <RichTextEditor
              value={form.detailContent || ""}
              onChange={(html) => set("detailContent", html)}
              placeholder="VD: bảng thông số kỹ thuật, kích thước, hướng dẫn bảo quản, ảnh chi tiết..."
            />
          </div>

          <div className="form-section">
            <div className="variants-header">
              <h3 style={{ margin: 0 }}>Biến thể sản phẩm (không bắt buộc)</h3>
              <button type="button" className="btn-add-variant" onClick={addVariantRow}>+ Thêm biến thể</button>
            </div>
            <p className="settings-field-hint" style={{ marginBottom: 12 }}>
              Xoá hết các dòng bên dưới nếu muốn chuyển sản phẩm về bán 1 loại duy nhất (dùng lại Chất liệu/Màu/Giá/Tồn kho ở trên).
            </p>

            {variants.length === 0 ? (
              <p className="empty-note">Chưa có biến thể nào.</p>
            ) : (
              <div className="variant-rows">
                <div className="variant-row variant-row--header">
                  <span>Chất liệu</span>
                  <span>Màu sắc</span>
                  <span>Giá (₫)</span>
                  <span>Tồn kho</span>
                  <span></span>
                </div>
                {variants.map((v, idx) => (
                  <Fragment key={v.id ?? `new-${idx}`}>
                    <div className="variant-row">
                      <select value={v.material} onChange={e => setVariantField(idx, "material", e.target.value)}>
                        {MATERIALS.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <select value={v.color} onChange={e => setVariantField(idx, "color", e.target.value)}>
                        {COLORS.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="0"
                        className={variantErrors[idx] && variantPriceBad(v) ? "is-invalid" : ""}
                        value={v.price}
                        onChange={e => setVariantField(idx, "price", e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="0"
                        className={variantErrors[idx] && variantStockBad(v) ? "is-invalid" : ""}
                        value={v.stock}
                        onChange={e => setVariantField(idx, "stock", e.target.value)}
                      />
                      <button type="button" className="variant-row__remove" onClick={() => removeVariantRow(idx)}>✕</button>
                    </div>
                    <FieldError message={variantErrors[idx]} />
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Khuyến mãi</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="discountPercent">Giảm giá (%)</label>
                <input
                  id="discountPercent"
                  name="discountPercent"
                  type="number"
                  min={0}
                  max={100}
                  className={errors.discountPercent ? "is-invalid" : ""}
                  value={form.discountPercent ?? 0}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 0 && v <= 100) set("discountPercent", e.target.value);
                  }}
                  onBlur={() => validateField("discountPercent", form)}
                  placeholder="0 = không giảm giá"
                />
                <FieldError message={errors.discountPercent} />
                <span className="settings-field-hint">Áp dụng cho MỌI biến thể (nếu có), tính trên giá của từng biến thể.</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Hình ảnh & Cài đặt</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>URL hình ảnh</label>
                <ImageUploadInput
                  value={form.image || ""}
                  onChange={url => set("image", url)}
                  placeholder="https://... , /images/san-pham.jpg hoặc tải lên từ máy →"
                  showPreview={false}
                />
                <FieldError message={errors.image} />
                {form.image && (
                  <div className="img-preview">
                    <img src={form.image} alt="preview" onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>

              <div className="form-group full">
                <label>Ảnh phụ (tối đa {MAX_EXTRA_IMAGES} ảnh — mỗi dòng 1 URL)</label>
                <textarea
                  rows={3}
                  name="imagesText"
                  className={errors.imagesText ? "is-invalid" : ""}
                  value={form.imagesText || ""}
                  onChange={e => set("imagesText", e.target.value)}
                  onBlur={() => validateField("imagesText", form)}
                  placeholder={"https://anh-phu-1.jpg\nhttps://anh-phu-2.jpg"}
                />
                <FieldError message={errors.imagesText} />
                <MultiImageUploadButton onUploaded={appendExtraImages} />
                <span className="settings-field-hint">
                  Hiện thành cột ảnh nhỏ bên trái ảnh chính ở trang chi tiết sản phẩm, khách bấm vào để đổi ảnh chính. Dán mỗi URL 1 dòng, hoặc bấm nút trên để chọn nhiều ảnh từ máy cùng lúc.
                </span>
                {parseImagesText(form.imagesText || "").length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {parseImagesText(form.imagesText || "").map((url, i) => (
                      <div key={i} className="img-preview" style={{ width: 70, height: 70 }}>
                        <img src={url} alt="" onError={e => e.target.style.display = "none"} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller || false}
                    onChange={e => set("isBestSeller", e.target.checked)}
                  />
                  <span>Đánh dấu là sản phẩm bán chạy</span>
                </label>
              </div>
            </div>
          </div>

          </form>
        </>
      )}
    </Modal>
  );
};

export default ProductFormModal;