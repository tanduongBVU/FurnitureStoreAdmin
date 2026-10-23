import Modal from "./Modal";

// Hộp xác nhận nhỏ (thay cho window.confirm) — dùng cho Ẩn / Hiện lại / Xoá.
//   danger : nút xác nhận màu đỏ
//   busy   : đang gọi API (khoá nút)
//   error  : thông báo lỗi hiện ngay trong hộp nếu thao tác thất bại
const ConfirmDialog = ({
  open, title, message, note, confirmLabel = "Xác nhận", cancelLabel = "Huỷ",
  danger = false, busy = false, error = "", onConfirm, onCancel,
}) => (
  <Modal
    open={open}
    title={title}
    size="sm"
    onClose={onCancel}
    closeOnEsc
    footer={
      <>
        <button type="button" className="lx-modal-btn lx-modal-btn--ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`lx-modal-btn ${danger ? "lx-modal-btn--danger" : "lx-modal-btn--primary"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Đang xử lý..." : confirmLabel}
        </button>
      </>
    }
  >
    <p className="lx-confirm-message">{message}</p>
    {note && <p className="lx-confirm-note">{note}</p>}
    {error && <div className="lx-confirm-error">⚠️ {error}</div>}
  </Modal>
);

export default ConfirmDialog;