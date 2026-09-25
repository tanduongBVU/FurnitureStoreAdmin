import { useState } from "react";
import api from "../../services/Api";

// ── Hàm tải 1 ảnh lên Backend, trả về URL ──────────────────────────────
// Kiểm tra loại file + dung lượng, báo lỗi bằng alert và trả null nếu không hợp lệ/thất bại.
async function uploadImage(file) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn đúng file ảnh (jpg, png, webp...).");
    return null;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhẹ hơn.");
    return null;
  }
  try {
    const formData = new FormData();
    formData.append("file", file);
    // Ép Content-Type về undefined để trình duyệt tự sinh multipart/form-data kèm
    // boundary đúng — nếu không, header mặc định application/json của instance api
    // sẽ đè lên và Backend trả lỗi 415 (giống lỗi đã gặp ở SiteSettings).
    const res = await api.post("/Upload", formData, {
      headers: { "Content-Type": undefined },
    });
    return res.data.url;
  } catch (err) {
    alert(err.response?.data?.message || "Tải ảnh lên thất bại, vui lòng thử lại.");
    return null;
  }
}

const uploadLabelStyle = (uploading) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 8, border: "1.5px solid #d8cfc0",
  background: uploading ? "#f0ebe0" : "#fff",
  fontSize: 13, whiteSpace: "nowrap", flexShrink: 0, fontWeight: 500,
  cursor: uploading ? "not-allowed" : "pointer",
});

// ── Ô nhập URL ảnh + nút "Tải ảnh lên" + ảnh xem trước ───────────────────
// Dùng thay cho <input type="text"> URL ảnh ở BẤT KỲ form Admin nào:
//
//   <ImageUploadInput
//     value={form.image}
//     onChange={(url) => set("image", url)}
//   />
//
// Props:
// - value: URL ảnh hiện tại (chuỗi)
// - onChange(url): gọi khi Admin gõ/dán URL, hoặc sau khi tải ảnh lên xong
// - placeholder: chữ mờ trong ô (tuỳ chọn)
// - showPreview: hiện ảnh xem trước bên dưới (mặc định true; đặt false nếu form
//   đã tự có khung xem trước riêng)
export default function ImageUploadInput({
  value,
  onChange,
  placeholder = "Dán URL ảnh, hoặc tải lên từ máy →",
  showPreview = true,
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) onChange(url);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <label style={uploadLabelStyle(uploading)}>
          {uploading ? "Đang tải..." : "📁 Tải ảnh lên"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files[0];
              handleFile(file);
              e.target.value = ""; // reset để chọn lại cùng 1 file vẫn kích hoạt onChange
            }}
          />
        </label>
      </div>

      {showPreview && value && (
        <div
          style={{
            marginTop: 8, width: 240, maxWidth: "100%", height: 120,
            borderRadius: 8, overflow: "hidden", border: "1.5px solid #e2e8f0",
          }}
        >
          <img
            src={value}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}
    </div>
  );
}

// ── Nút tải NHIỀU ảnh cùng lúc (dùng cho ô "mỗi dòng 1 URL" như gallery dự án) ──
// Chọn nhiều file 1 lần → tải lần lượt → gọi onUploaded(mảng URL) ĐÚNG 1 LẦN khi xong
// hết, để component cha nối vào danh sách hiện có.
export function MultiImageUploadButton({ onUploaded, label = "📁 Tải ảnh lên từ máy (chọn được nhiều ảnh)" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      setProgress(`Đang tải ${i + 1}/${files.length}...`);
      const url = await uploadImage(files[i]);
      if (url) urls.push(url);
    }
    setUploading(false);
    setProgress("");
    if (urls.length > 0) onUploaded(urls);
  };

  return (
    <label style={{ ...uploadLabelStyle(uploading), marginTop: 8, alignSelf: "flex-start" }}>
      {uploading ? progress : label}
      <input
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        disabled={uploading}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}