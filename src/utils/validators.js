// Bộ hàm kiểm tra dữ liệu nhập — dùng chung cho Client và Admin (copy file này vào src/utils/ của MỖI project).
// Mỗi hàm trả về MỘT "rule": (value, allValues) => chuỗi lỗi, hoặc "" nếu hợp lệ.
// Các rule định dạng (email, phone, url, số...) BỎ QUA giá trị rỗng — muốn bắt buộc nhập thì thêm required() đứng trước.

const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "";

export const required = (msg = "Vui lòng không để trống.") => (v) => (isEmpty(v) ? msg : "");

export const email = (msg = "Email không hợp lệ (ví dụ: ten@gmail.com).") => (v) =>
  isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? "" : msg;

// Số điện thoại di động Việt Nam: 10 số, đầu 03/05/07/08/09 (hoặc +84 / 84 thay cho số 0). Cho phép khoảng trắng, dấu chấm, gạch ngang.
export const phoneVN = (msg = "Số điện thoại không hợp lệ (10 số, ví dụ: 0912345678).") => (v) => {
  if (isEmpty(v)) return "";
  const cleaned = String(v).replace(/[\s.\-]/g, "");
  return /^(0|\+?84)(3|5|7|8|9)\d{8}$/.test(cleaned) ? "" : msg;
};

export const minLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).trim().length >= n ? "" : msg || `Cần ít nhất ${n} ký tự.`;

export const maxLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).length <= n ? "" : msg || `Tối đa ${n} ký tự.`;

export const number = (msg = "Vui lòng nhập một con số hợp lệ.") => (v) =>
  isEmpty(v) || Number.isFinite(Number(v)) ? "" : msg;

export const integer = (msg = "Vui lòng nhập số nguyên.") => (v) =>
  isEmpty(v) || Number.isInteger(Number(v)) ? "" : msg;

export const minValue = (n, msg) => (v) =>
  isEmpty(v) || Number(v) >= n ? "" : msg || `Giá trị phải từ ${n} trở lên.`;

export const maxValue = (n, msg) => (v) =>
  isEmpty(v) || Number(v) <= n ? "" : msg || `Giá trị không được vượt quá ${n}.`;

// Địa chỉ web bắt đầu bằng http:// hoặc https://
export const url = (msg = "Đường dẫn không hợp lệ (phải bắt đầu bằng http:// hoặc https://).") => (v) => {
  if (isEmpty(v)) return "";
  try {
    const u = new URL(String(v).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? "" : msg;
  } catch {
    return msg;
  }
};

// Đường dẫn ảnh: chấp nhận địa chỉ http(s):// HOẶC đường dẫn nội bộ bắt đầu bằng "/" (VD: /images/sofa.jpg)
export const urlOrPath = (msg = "Đường dẫn không hợp lệ (phải bắt đầu bằng http://, https:// hoặc /).") => (v) => {
  if (isEmpty(v)) return "";
  const s = String(v).trim();
  if (s.startsWith("/") && !s.startsWith("//")) return /\s/.test(s) ? msg : "";
  return url(msg)(v);
};

// Nội dung từ trình soạn thảo (Quill) — coi là TRỐNG nếu chỉ còn thẻ rỗng như <p><br></p>; có ảnh/video thì tính là có nội dung
export const requiredHtml = (msg = "Vui lòng nhập nội dung.") => (v) => {
  const s = String(v || "");
  if (/<(img|iframe|video)\b/i.test(s)) return "";
  const text = s.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text ? "" : msg;
};

// Ngày (định dạng yyyy-MM-dd của <input type="date">) không được ở quá khứ. allowSame: giá trị gốc được phép giữ nguyên (VD: sửa mã đã hết hạn)
export const notPastDate = (msg = "Ngày không được ở quá khứ.", allowSame = "") => (v) => {
  if (isEmpty(v) || v === allowSame) return "";
  const endOfDay = new Date(`${v}T23:59:59`);
  if (isNaN(endOfDay.getTime())) return "Ngày không hợp lệ.";
  return endOfDay >= new Date() ? "" : msg;
};

// Khớp mẫu ký tự (regex) — VD: pattern(/^[A-Z0-9_-]+$/, "Chỉ gồm chữ in hoa, số, - và _")
export const pattern = (regex, msg = "Định dạng không hợp lệ.") => (v) =>
  isEmpty(v) || regex.test(String(v)) ? "" : msg;

// Giá trị phải trùng với ô khác (VD: xác nhận mật khẩu): sameAs("password", "Mật khẩu xác nhận chưa khớp.")
export const sameAs = (otherField, msg = "Giá trị nhập lại chưa khớp.") => (v, all) =>
  v === all?.[otherField] ? "" : msg;

// Rule tự viết nhanh: custom((v, all) => điều kiện lỗi ? "thông báo" : "")
export const custom = (fn) => fn;

// ── Bổ sung cho form Admin ──

// Số phải lớn hơn 0 (giá tiền...)
export const positive = (msg = "Giá trị phải lớn hơn 0.") => (v) =>
  isEmpty(v) || Number(v) > 0 ? "" : msg;

// Đường dẫn ảnh: http(s)://... HOẶC đường dẫn nội bộ bắt đầu bằng "/" (VD: /images/san-pham.jpg)
export const imagePath = (msg = "Đường dẫn ảnh không hợp lệ (bắt đầu bằng http://, https:// hoặc /).") => (v) => {
  if (isEmpty(v)) return "";
  const s = String(v).trim();
  if (s.startsWith("/")) return /\s/.test(s) ? msg : "";
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? "" : msg;
  } catch {
    return msg;
  }
};

// Danh sách ảnh nhập "mỗi dòng 1 đường dẫn": báo rõ dòng nào sai
export const imageList = () => (v) => {
  if (isEmpty(v)) return "";
  const lines = String(v).split("\n").map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    const err = imagePath()(lines[i]);
    if (err) return `Dòng ${i + 1} không phải đường dẫn ảnh hợp lệ (bắt đầu bằng http://, https:// hoặc /).`;
  }
  return "";
};