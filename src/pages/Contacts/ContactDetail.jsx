import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import "./ContactDetail.css";

const STATUS_LIST = ["Mới", "Đang xử lý", "Đã xử lý"];

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/Contacts/${id}`)
      .then(res => { setContact(res.data); setStatus(res.data.status); setNote(res.data.note || ""); })
      .catch(() => setError("Không tìm thấy liên hệ!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/Contacts/${id}`, { status, note });
      navigate("/contacts");
    } catch {
      setError("Lỗi khi cập nhật liên hệ!");
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="contact-detail-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải...</p></div>
    </div>
  );

  if (!contact) return (
    <div className="contact-detail-page">
      <div className="form-error">⚠️ Không tìm thấy liên hệ!</div>
      <button className="btn-back" onClick={() => navigate("/contacts")}>← Quay lại</button>
    </div>
  );

  return (
    <div className="contact-detail-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/contacts")}>← Quay lại</button>
        <h2>Chi tiết liên hệ #{contact.id}</h2>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div className="form-card">
        <div className="contact-info-grid">
          <div className="info-item"><span>👤 Họ tên</span><strong>{contact.name}</strong></div>
          <div className="info-item"><span>📞 Điện thoại</span><strong>{contact.phone}</strong></div>
          <div className="info-item"><span>✉️ Email</span><strong>{contact.email}</strong></div>
          <div className="info-item"><span>📅 Ngày gửi</span><strong>{new Date(contact.createdAt).toLocaleDateString("vi-VN")}</strong></div>
        </div>

        <div className="message-box">
          <h3>Nội dung liên hệ</h3>
          <p>{contact.message}</p>
        </div>

        <div className="status-block">
          <h3>Trạng thái xử lý</h3>
          <div className="status-options">
            {STATUS_LIST.map(s => (
              <button key={s} className={`status-opt ${status === s ? "status-opt--active" : ""}`}
                onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="note-block">
          <h3>Ghi chú nội bộ</h3>
          <textarea rows={4} placeholder="Ghi chú về quá trình xử lý..." value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={() => navigate("/contacts")}>Huỷ</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;
