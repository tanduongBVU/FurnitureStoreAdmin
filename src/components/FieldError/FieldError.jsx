import "./FieldError.css";

// Dòng chữ đỏ báo lỗi, đặt NGAY DƯỚI ô nhập:
//   <input name="email" className={errors.email ? "is-invalid" : ""} ... />
//   <FieldError message={errors.email} />
// Không có lỗi thì không hiện gì.
export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  );
}