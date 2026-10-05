import { useState, useEffect, useRef } from "react";
import api from "../../services/Api";

// Khung "Soạn phản hồi" dưới mỗi đánh giá (dùng cho đánh giá thấp).
// - AI soạn bản nháp tự động khi mở; nhân viên sửa rồi mới gửi.
// - Phản hồi được GỬI RIÊNG QUA EMAIL cho khách (không hiện công khai ở trang sản phẩm).
// - Hệ thống chưa lưu lịch sử phản hồi.
export default function ReviewReplyDraft({ reviewId, productName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [original, setOriginal] = useState("");
  const [warning, setWarning] = useState("");
  const [aiGenerated, setAiGenerated] = useState(true);
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState(`LuxWood phản hồi đánh giá của bạn về ${productName}`);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [copied, setCopied] = useState(false);
  const didRun = useRef(false); // tránh gọi AI 2 lần khi React StrictMode chạy effect kép ở môi trường dev

  const generate = async (force = false) => {
    if (!force && draft && draft !== original && !window.confirm("Soạn lại sẽ thay thế phần bạn vừa chỉnh sửa. Tiếp tục?")) {
      return;
    }
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await api.post(`/Reviews/${reviewId}/ai-reply`);
      setDraft(res.data.draft || "");
      setOriginal(res.data.draft || "");
      setWarning(res.data.warning || "");
      setAiGenerated(!!res.data.aiGenerated);
      setCustomerEmail(res.data.customerEmail || "");
    } catch (err) {
      setError(err.response?.data?.message || "Không soạn được bản nháp lúc này, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    generate(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không sao chép tự động được — hãy bôi đen nội dung và sao chép thủ công.");
    }
  };

  const sendEmail = async () => {
    setError("");
    if (!customerEmail) {
      setError("Không tìm thấy email của khách này.");
      return;
    }
    if (!subject.trim() || !draft.trim()) {
      setError("Tiêu đề và nội dung email không được để trống.");
      return;
    }
    if (/\[nhân viên điền/i.test(draft)) {
      setError("Còn chỗ [nhân viên điền: ...] chưa điền hoặc chưa xoá — hãy hoàn thiện trước khi gửi.");
      return;
    }
    const confirmText = sentTo
      ? `Email này ĐÃ được gửi tới ${customerEmail}. Gửi thêm một lần nữa?`
      : `Gửi email này tới ${customerEmail}?`;
    if (!window.confirm(confirmText)) return;

    setSending(true);
    try {
      const res = await api.post(`/Reviews/${reviewId}/reply-email`, { subject: subject.trim(), body: draft });
      setSentTo(res.data.sentTo);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi email thất bại, vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="review-reply">
      <div className="review-reply__head">
        <div>
          <p className="review-reply__title">✨ Phản hồi đánh giá bằng AI</p>
          <p className="review-reply__sub">
            AI chỉ soạn nháp. Thư được gửi <strong>riêng qua email cho khách</strong>, không hiện công khai trên trang sản phẩm.
          </p>
        </div>
        <button type="button" className="review-reply__close" onClick={onClose} aria-label="Đóng">✕</button>
      </div>

      {error && <p className="review-reply__error">{error}</p>}

      {sentTo && (
        <p className="review-reply__success">
          ✓ Đã gửi email tới <strong>{sentTo}</strong>. (Hệ thống chưa lưu lịch sử phản hồi này.)
        </p>
      )}

      {loading ? (
        <p className="review-reply__loading">Đang soạn bản nháp...</p>
      ) : (
        draft !== "" && (
          <>
            {!aiGenerated && <p className="review-reply__warn">⚠ {warning || "Đây là mẫu trả lời chung (không phải AI)."}</p>}

            <label className="review-reply__label">
              Gửi tới: <strong>{customerEmail || "(không có email)"}</strong>
            </label>
            <input
              className="review-reply__subject"
              type="text"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Tiêu đề email"
            />
            <textarea
              className="review-reply__textarea"
              rows={9}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <p className="review-reply__hint">
              Chỗ ghi <code>[nhân viên điền: ...]</code> là thông tin AI không có — hãy điền hoặc xoá trước khi gửi.
            </p>

            <div className="review-reply__actions">
              <button
                type="button"
                className="review-reply__btn review-reply__btn--send"
                onClick={sendEmail}
                disabled={sending || !customerEmail}
              >
                {sending ? "Đang gửi..." : sentTo ? "✉ Gửi lại" : "✉ Gửi email cho khách"}
              </button>
              <button type="button" className="review-reply__btn" onClick={copyDraft}>
                {copied ? "✓ Đã sao chép" : "Sao chép"}
              </button>
              <button type="button" className="review-reply__btn" onClick={() => generate(false)} disabled={sending}>
                Soạn lại
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}