import { useState, useRef, useEffect } from "react";
import api from "../../services/Api";

// Widget chat AI nổi cho Admin — khác hẳn ChatWidget bên Client (dành cho khách hàng).
// Gọi endpoint /AdminChat mới, AI trả lời dựa trên số liệu THẬT lấy từ DB tại thời điểm
// hỏi (xem AdminChatController.cs phía Backend), không cần Admin tự tra cứu qua nhiều trang.
//
// Màu sắc dùng tông XANH DƯƠNG/NAVY khớp giao diện Admin (sidebar navy, nút/active state
// xanh #4f72e3) — KHÁC với tông nâu walnut/kem của trang Client, vì đây là 2 hệ giao diện
// riêng biệt.
const NAVY = "#1e2749";
const BLUE = "#4f72e3";
const BLUE_LIGHT = "#eef2fb";
const TEXT = "#1e2333";
const TEXT_MUTED = "#8a93a6";
const BORDER = "#e2e6f0";

// Gemini đôi khi vẫn lỡ chèn markdown (**đậm**) dù đã dặn trong system prompt — hàm này
// tách chuỗi theo cặp ** và render phần ở giữa thành <strong>, thay vì để lộ dấu ** thừa
// ra màn hình. Đây là lớp phòng hờ, không thay thế việc dặn AI ở Backend.
const renderWithBold = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Chào Admin! Hỏi mình bất cứ điều gì về đơn hàng, sản phẩm, liên hệ... mình sẽ tra cứu số liệu thật để trả lời." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/AdminChat", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Không gửi được tin nhắn, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút nổi mở/đóng — luôn hiện góc phải dưới, KHÔNG che sidebar/nội dung chính */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          width: 56, height: 56, borderRadius: "50%",
          background: NAVY, color: "#fff", border: "none",
          fontSize: 24, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(30,39,73,.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .15s",
        }}
        title="Trợ lý AI Admin"
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", bottom: 92, right: 24, zIndex: 100,
            width: 360, maxWidth: "calc(100vw - 48px)", height: 480, maxHeight: "70vh",
            background: "#fff", borderRadius: 14, overflow: "hidden",
            boxShadow: "0 20px 50px rgba(30,39,73,.25)",
            border: `1px solid ${BORDER}`,
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px", background: NAVY, color: "#fff" }}>
            <strong style={{ fontSize: 14 }}>🤖 Trợ lý AI Admin</strong>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.65)" }}>
              Trả lời dựa trên số liệu thật, cập nhật theo thời gian thực
            </p>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, background: "#fbfcfe" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.role === "user" ? BLUE : BLUE_LIGHT,
                  color: m.role === "user" ? "#fff" : TEXT,
                  padding: "9px 13px",
                  borderRadius: 12,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderWithBold(m.text)}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", fontSize: 13, color: TEXT_MUTED, padding: "4px 6px" }}>
                Đang tra cứu số liệu...
              </div>
            )}
            {error && (
              <div style={{ alignSelf: "flex-start", fontSize: 13, color: "#dc2626", padding: "4px 6px" }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${BORDER}`, background: "#fff" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về đơn hàng, sản phẩm, liên hệ..."
              disabled={loading}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 8,
                border: `1.5px solid ${BORDER}`, fontSize: 13.5, outline: "none",
                color: TEXT,
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "0 16px", borderRadius: 8, border: "none",
                background: loading || !input.trim() ? "#c7cee3" : BLUE,
                color: "#fff", fontSize: 13.5, fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}