import { useState } from "react";

// Hook kiểm tra form theo từng ô. Copy vào src/hooks/ của MỖI project (Client và Admin).
//
// const rules = {
//   name:  [required("Vui lòng nhập họ tên.")],
//   email: [required("Vui lòng nhập email."), email()],
// };
// const { errors, validateField, validateAll, clearError, setErrors } = useFormValidation(rules);
//
// - Khi người dùng RỜI khỏi ô:      onBlur={() => validateField("email", form)}
// - Khi người dùng đang GÕ:         onChange={...; if (errors.email) clearError("email")}
// - Khi bấm GỬI:                    if (!validateAll(form)) return;   // hiện lỗi mọi ô và nhảy tới ô lỗi đầu tiên
// - Lỗi từ server theo từng ô:      setErrors({ email: "Email đã được sử dụng!" })
export default function useFormValidation(rules) {
  const [errors, setErrors] = useState({});

  // Chạy lần lượt các rule của 1 ô, dừng ở lỗi đầu tiên
  const check = (name, values) => {
    for (const rule of rules[name] || []) {
      const msg = rule(values[name], values);
      if (msg) return msg;
    }
    return "";
  };

  const validateField = (name, values) => {
    const msg = check(name, values);
    setErrors((prev) => ({ ...prev, [name]: msg }));
    return !msg;
  };

  const validateAll = (values) => {
    const next = {};
    let firstInvalid = null;
    Object.keys(rules).forEach((name) => {
      const msg = check(name, values);
      next[name] = msg;
      if (msg && !firstInvalid) firstInvalid = name;
    });
    setErrors(next);
    if (firstInvalid) {
      // Nhảy tới ô lỗi đầu tiên nếu ô đó có thuộc tính name="..."
      const el = document.querySelector(`[name="${firstInvalid}"]`);
      if (el && typeof el.focus === "function") el.focus();
    }
    return !firstInvalid;
  };

  const clearError = (name) => setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));

  return { errors, validateField, validateAll, clearError, setErrors };
}