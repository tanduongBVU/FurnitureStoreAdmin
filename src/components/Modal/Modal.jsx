import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

// Khung popup dùng chung cho các form Thêm/Sửa và hộp xác nhận ở trang quản trị.
//   open        : hiện/ẩn
//   title       : tiêu đề
//   size        : "sm" | "md" | "lg" (bề rộng tối đa 440 / 820 / 980px)
//   footer      : phần nút bên dưới (thường là nút Huỷ + nút chính)
//   closeOnEsc  : bấm Esc để đóng (mặc định TẮT với form để khỏi mất dữ liệu đang nhập vì lỡ tay)
//   closeOnOverlay : bấm ra ngoài nền mờ để đóng (mặc định TẮT, cùng lý do)
// Render qua portal ra document.body nên không bị thanh bên / header che hay cắt.
const Modal = ({ open, title, onClose, size = "md", footer, children, closeOnEsc = false, closeOnOverlay = false }) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (closeOnEsc && e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    // Khoá cuộn của trang phía sau khi popup đang mở
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="lx-modal-overlay"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`lx-modal lx-modal--${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="lx-modal-header"><h2>{title}</h2></div>
        <div className="lx-modal-body">{children}</div>
        {footer && <div className="lx-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;