import { useState } from "react";
import api from "../../services/Api";
import "./AiReplyDraft.css";

const URGENCY_CLASS = {
  "cao": "ai-badge--danger",
  "trung bình": "ai-badge--warning",
  "thấp": "ai-badge--muted",
};

const DEFAULT_SUBJECT = "Phản hồi liên hệ từ LuxWood";

// Khối "Soạn trả lời bằng AI" + GỬI EMAIL cho trang chi tiết liên hệ.
// Cách dùng:
//   <AiReplyDraft contactId={contact.id} email={contact.email} onSent={(r) => ...} />
// - AI CHỈ soạn nháp; nhân viên sửa xong mới bấm "Gửi email cho khách".
// - onSent(r) được gọi sau khi Backend đã gửi thật + lưu trạng thái "Đã xử lý" và dòng lịch sử vào ghi chú
//   (r = { sentTo, status, logLine }) để trang cha cập nhật giao diện.
export default function AiReplyDraft({ contactId, email, onSent }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const generate = async () => {
    // Bản nháp đã bị sửa tay mà bấm soạn lại thì hỏi trước, tránh mất nội dung vừa chỉnh
    if (result && draft !== result.draft && !window.confirm("Soạn lại sẽ thay thế phần bạn vừa chỉnh sửa. Tiếp tục?")) {
      return;
    }
    setLoading(true);
    setError("");
    setCopied(false);
    setSentTo("");
    try {
      const res = await api.post(`/Contacts/${contactId}/ai-draft`);
      setResult(res.data);
      setDraft(res.data.draft || "");
    } catch (err) {
      setError(err.response?.data?.message || "Không soạn được bản nháp lúc này, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

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
    if (!email) {
      setError("Liên hệ này không có địa chỉ email.");
      return;
    }
    if (!subject.trim()) {
      setError("Vui lòng nhập tiêu đề email.");
      return;
    }
    if (!draft.trim()) {
      setError("Nội dung email đang trống.");
      return;
    }
    if (/\[nhân viên điền/i.test(draft)) {
      setError("Còn chỗ [nhân viên điền: ...] chưa điền hoặc chưa xoá — hãy hoàn thiện trước khi gửi.");
      return;
    }
    const confirmText = sentTo
      ? `Email này ĐÃ được gửi tới ${email}. Gửi thêm một lần nữa?`
      : `Gửi email này tới ${email}?`;
    if (!window.confirm(confirmText)) return;

    setSending(true);
    try {
      const res = await api.post(`/Contacts/${contactId}/reply`, { subject: subject.trim(), body: draft });
      setSentTo(res.data.sentTo);
      if (onSent) onSent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi email thất bại, vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject || DEFAULT_SUBJECT)}&body=${encodeURIComponent(draft)}`
    : null;

  return (
    <div className="ai-reply">
      <div className="ai-reply__head">
        <div>
          <h3 className="ai-reply__title">✨ Soạn trả lời bằng AI</h3>
          <p className="ai-reply__sub">AI chỉ soạn bản nháp — bạn kiểm tra, chỉnh sửa rồi mới gửi cho khách.</p>
        </div>
        <button type="button" className="ai-reply__btn ai-reply__btn--primary" onClick={generate} disabled={loading || sending}>
          {loading ? "Đang soạn..." : result ? "Soạn lại" : "Soạn bản nháp"}
        </button>
      </div>

      {error && <p className="ai-reply__error">{error}</p>}

      {sentTo && (
        <p className="ai-reply__success">
          ✓ Đã gửi email tới <strong>{sentTo}</strong>. Liên hệ đã chuyển sang "Đã xử lý" và nội dung đã được ghi vào Ghi chú nội bộ.
        </p>
      )}

      {result && (
        <div className="ai-reply__body">
          <div className="ai-reply__tags">
            <span className="ai-badge ai-badge--info">{result.category}</span>
            <span className={`ai-badge ${URGENCY_CLASS[result.urgency] || "ai-badge--muted"}`}>
              Mức khẩn: {result.urgency}
            </span>
            {!result.aiGenerated && <span className="ai-badge ai-badge--muted">Mẫu chung (không phải AI)</span>}
          </div>

          {result.summary && <p className="ai-reply__summary"><strong>Khách cần:</strong> {result.summary}</p>}
          {result.warning && <p className="ai-reply__warn">⚠ {result.warning}</p>}

          <label className="ai-reply__label">
            Gửi tới: <strong>{email || "(không có email)"}</strong>
          </label>
          <input
            className="ai-reply__subject"
            type="text"
            maxLength={200}
            placeholder="Tiêu đề email"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <textarea
            className="ai-reply__textarea"
            rows={10}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <p className="ai-reply__hint">
            Chỗ ghi <code>[nhân viên điền: ...]</code> là thông tin AI không có — hãy điền hoặc xoá trước khi gửi.
          </p>

          <div className="ai-reply__actions">
            <button
              type="button"
              className="ai-reply__btn ai-reply__btn--send"
              onClick={sendEmail}
              disabled={sending || loading || !email}
            >
              {sending ? "Đang gửi..." : sentTo ? "✉ Gửi lại" : "✉ Gửi email cho khách"}
            </button>
            <button type="button" className="ai-reply__btn" onClick={copyDraft}>
              {copied ? "✓ Đã sao chép" : "Sao chép"}
            </button>
            {mailtoHref && (
              <a className="ai-reply__btn ai-reply__btn--link" href={mailtoHref}>
                Mở trong ứng dụng email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}