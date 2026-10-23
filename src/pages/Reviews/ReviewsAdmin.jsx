import { useState, useEffect } from "react";
import api from "../../services/Api";
import ReviewInsights from "./ReviewInsights";
import ReviewReplyDraft from "./ReviewReplyDraft";
import "./ReviewsAdmin.css";

// Trang Đánh giá bên Admin: kiểm duyệt đánh giá của khách.
// - Khách gửi đánh giá → trạng thái "Chờ duyệt" (chưa hiện công khai).
// - Admin/Nhân viên bấm "Duyệt" → hiện công khai.
// - "Từ chối" (đánh giá chờ duyệt) / "Gỡ" (đánh giá đã duyệt) = xóa hẳn đánh giá — Backend chỉ cho Admin.
// - Tab "Phân tích" (thống kê + AI tóm tắt) chỉ tính đánh giá đã duyệt.
// - "Soạn phản hồi": gửi email RIÊNG cho khách không hài lòng (không hiện công khai).
const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState(null); // { type: "success" | "error", text }
  const [busyId, setBusyId] = useState(null); // đánh giá đang được duyệt / gỡ
  const [tab, setTab] = useState("pending"); // "pending" | "all" | "insights"
  const [replyOpenId, setReplyOpenId] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Reviews/all");
      setReviews(res.data);
    } catch {
      setError("Không thể tải danh sách đánh giá. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const flash = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleApprove = async (r) => {
    setBusyId(r.id);
    try {
      await api.patch(`/Reviews/${r.id}/approve`);
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, isApproved: true } : x)));
      flash("success", "Đã duyệt đánh giá, đánh giá hiện công khai trên trang sản phẩm.");
    } catch {
      flash("error", "Không duyệt được đánh giá. Vui lòng thử lại.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r) => {
    const label = r.isApproved ? "gỡ" : "từ chối";
    if (!window.confirm(`Bạn chắc chắn muốn ${label} đánh giá của "${r.userName}" cho "${r.productName}"? Đánh giá sẽ bị xóa hẳn.`)) return;
    setBusyId(r.id);
    try {
      await api.delete(`/Reviews/${r.id}`);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      if (replyOpenId === r.id) setReplyOpenId(null);
      flash("success", r.isApproved ? "Đã gỡ đánh giá." : "Đã từ chối đánh giá.");
    } catch (err) {
      flash(
        "error",
        err.response?.status === 403
          ? "Chỉ Quản trị viên mới được gỡ hoặc từ chối đánh giá."
          : "Không xóa được đánh giá. Vui lòng thử lại."
      );
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");
  const starsOf = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const shown = tab === "pending" ? reviews.filter((r) => !r.isApproved) : reviews;

  return (
    <div className="reviews-admin-page">
      <div className="reviews-toolbar">
        <button
          className={`reviews-tab ${tab === "pending" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Chờ duyệt <span className="reviews-tab-count">{pendingCount}</span>
        </button>
        <button
          className={`reviews-tab ${tab === "all" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả đánh giá <span className="reviews-tab-count">{reviews.length}</span>
        </button>
        <button
          className={`reviews-tab ${tab === "insights" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("insights")}
        >
          ✨ Phân tích
        </button>
      </div>

      {actionMsg && (
        <div className={`reviews-flash reviews-flash--${actionMsg.type}`}>{actionMsg.text}</div>
      )}

      {tab === "insights" ? (
        <ReviewInsights />
      ) : (
        <>
          {error && (
            <div className="reviews-error-box">
              ⚠️ {error}
              <div style={{ marginTop: 10 }}>
                <button className="reviews-tab" onClick={fetchReviews}>Thử lại</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="reviews-loading-box"><div className="reviews-spinner" /><p>Đang tải đánh giá...</p></div>
          ) : !error && shown.length === 0 ? (
            <div className="reviews-empty">
              {tab === "pending" ? "Không có đánh giá nào đang chờ duyệt." : "Chưa có đánh giá nào."}
            </div>
          ) : !error && (
            <div className="reviews-list">
              {shown.map((r) => (
                <div className="review-card" key={r.id}>
                  <div className="review-card__head">
                    <div>
                      <span className="review-card__product">{r.productName}</span>
                      <div className="review-card__meta">
                        <span className="review-card__name">{r.userName}</span>
                        <span className="review-stars">{starsOf(r.rating)}</span>
                        <span className="review-card__date">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`review-status ${r.isApproved ? "review-status--approved" : "review-status--pending"}`}>
                      {r.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </div>

                  {r.comment && <p className="review-card__comment">{r.comment}</p>}

                  <div className="review-card__actions">
                    {!r.isApproved && (
                      <button
                        className="review-btn-approve"
                        onClick={() => handleApprove(r)}
                        disabled={busyId === r.id}
                      >
                        ✓ Duyệt
                      </button>
                    )}
                    <button
                      className="review-btn-delete"
                      onClick={() => handleDelete(r)}
                      disabled={busyId === r.id}
                    >
                      {r.isApproved ? "Gỡ đánh giá" : "Từ chối"}
                    </button>

                    {/* Đánh giá thấp (≤ 3 sao): soạn thư phản hồi RIÊNG gửi email cho khách — không hiện công khai */}
                    {r.rating <= 3 && (
                      <button
                        className="review-btn-ai"
                        onClick={() => setReplyOpenId(replyOpenId === r.id ? null : r.id)}
                      >
                        ✨ {replyOpenId === r.id ? "Đóng phản hồi" : "Soạn phản hồi"}
                      </button>
                    )}
                  </div>

                  {replyOpenId === r.id && (
                    <ReviewReplyDraft
                      key={r.id}
                      reviewId={r.id}
                      productName={r.productName}
                      onClose={() => setReplyOpenId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsAdmin;