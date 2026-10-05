import { useState, useEffect } from "react";
import api from "../../services/Api";
import ReviewInsights from "./ReviewInsights";
import ReviewReplyDraft from "./ReviewReplyDraft";
import "./ReviewsAdmin.css";

const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("pending"); // "pending" | "approved" | "all" | "insights"
  const [replyOpenId, setReplyOpenId] = useState(null); // review đang mở khung soạn phản hồi AI

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

  const handleApprove = async (id) => {
    try {
      await api.patch(`/Reviews/${id}/approve`);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } catch {
      alert("Lỗi khi duyệt đánh giá!");
    }
  };

  const handleReject = async (review) => {
    const actionText = review.isApproved ? "gỡ" : "từ chối";
    if (!window.confirm(`Bạn có chắc muốn ${actionText} đánh giá này không? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/Reviews/${review.id}`);
      setReviews(prev => prev.filter(r => r.id !== review.id));
      if (replyOpenId === review.id) setReplyOpenId(null);
    } catch {
      alert("Lỗi khi xoá đánh giá!");
    }
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  const filtered = reviews.filter(r => {
    if (tab === "pending") return !r.isApproved;
    if (tab === "approved") return r.isApproved;
    return true;
  });

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");
  const starsOf = (n) => "★".repeat(n) + "☆".repeat(5 - n);

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
          className={`reviews-tab ${tab === "approved" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("approved")}
        >
          Đã duyệt <span className="reviews-tab-count">{approvedCount}</span>
        </button>
        <button
          className={`reviews-tab ${tab === "all" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả <span className="reviews-tab-count">{reviews.length}</span>
        </button>
        <button
          className={`reviews-tab ${tab === "insights" ? "reviews-tab--active" : ""}`}
          onClick={() => setTab("insights")}
        >
          ✨ Phân tích
        </button>
      </div>

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
          ) : !error && filtered.length === 0 ? (
            <div className="reviews-empty">
              {tab === "pending" ? "Không có đánh giá nào đang chờ duyệt." : "Không có đánh giá nào ở mục này."}
            </div>
          ) : !error && (
            <div className="reviews-list">
              {filtered.map(r => (
                <div className={`review-card ${!r.isApproved ? "review-card--pending" : ""}`} key={r.id}>
                  <div className="review-card__head">
                    <div>
                      <span className="review-card__product">{r.productName}</span>
                      <div className="review-card__meta">
                        <span className="review-card__name">{r.userName}</span>
                        <span className="review-stars">{starsOf(r.rating)}</span>
                        <span className="review-card__date">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.isApproved && <span className="review-badge-approved">✓ Đã duyệt</span>}
                  </div>

                  {r.comment && <p className="review-card__comment">{r.comment}</p>}

                  <div className="review-card__actions">
                    {!r.isApproved && (
                      <button className="review-btn-approve" onClick={() => handleApprove(r.id)}>
                        ✓ Duyệt
                      </button>
                    )}
                    {r.rating <= 3 && (
                      <button
                        className="review-btn-ai"
                        onClick={() => setReplyOpenId(replyOpenId === r.id ? null : r.id)}
                      >
                        ✨ {replyOpenId === r.id ? "Đóng phản hồi" : "Soạn phản hồi"}
                      </button>
                    )}
                    <button className="review-btn-reject" onClick={() => handleReject(r)}>
                      {r.isApproved ? "🗑️ Gỡ" : "✕ Từ chối"}
                    </button>
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