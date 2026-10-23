import { useState, useEffect } from "react";
import api from "../../services/Api";

const starsOf = (n) => {
  const full = Math.round(n);
  return "★".repeat(full) + "☆".repeat(5 - full);
};

// Tab "Phân tích": thống kê theo sản phẩm (số liệu do Backend tính từ đánh giá ĐÃ DUYỆT)
// + nút "Phân tích AI" để AI đọc nội dung đánh giá và tóm tắt điểm khen/chê của từng sản phẩm.
export default function ReviewInsights() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kết quả AI theo từng sản phẩm: { [productId]: { loading, error, data } }
  const [ai, setAi] = useState({});

  useEffect(() => {
    api.get("/Reviews/stats")
      .then((res) => setStats(res.data))
      .catch(() => setError("Không thể tải thống kê đánh giá. Kiểm tra backend đang chạy chưa."))
      .finally(() => setLoading(false));
  }, []);

  const analyze = async (productId) => {
    setAi((prev) => ({ ...prev, [productId]: { loading: true, error: "", data: prev[productId]?.data } }));
    try {
      const res = await api.post(`/Reviews/product/${productId}/ai-summary`);
      setAi((prev) => ({ ...prev, [productId]: { loading: false, error: "", data: res.data } }));
    } catch (err) {
      setAi((prev) => ({
        ...prev,
        [productId]: {
          loading: false,
          error: err.response?.data?.message || "Không phân tích được lúc này, vui lòng thử lại.",
          data: prev[productId]?.data,
        },
      }));
    }
  };

  if (loading) {
    return <div className="reviews-loading-box"><div className="reviews-spinner" /><p>Đang tải thống kê...</p></div>;
  }
  if (error) return <div className="reviews-error-box">⚠️ {error}</div>;
  if (stats.length === 0) {
    return <div className="reviews-empty">Chưa có đánh giá nào được duyệt để thống kê.</div>;
  }

  return (
    <div className="insights">
      <p className="insights__note">
        Chỉ tính các đánh giá <strong>đã duyệt</strong>. Sản phẩm điểm thấp nhất được xếp lên đầu.
        Số liệu do hệ thống tính; AI chỉ đọc nội dung đánh giá để tóm tắt.
      </p>

      {stats.map((s) => {
        const state = ai[s.productId] || {};
        const total = s.count || 1;
        const trend =
          s.recentAverage != null && s.priorAverage != null
            ? Math.round((s.recentAverage - s.priorAverage) * 100) / 100
            : null;
        const lowWarn = s.count >= 3 && s.lowPercent >= 20;
        const canAnalyze = s.withCommentCount >= 3;

        return (
          <div className="insight-card" key={s.productId}>
            <div className="insight-card__head">
              <div>
                <p className="insight-card__name">{s.productName}</p>
                <p className="insight-card__avg">
                  <span className="review-stars">{starsOf(s.average)}</span>
                  <strong>{s.average.toFixed(1)}</strong>
                  <span className="insight-card__count">({s.count} đánh giá)</span>
                </p>
              </div>
              <div className="insight-card__badges">
                {lowWarn && <span className="insight-pill insight-pill--danger">{s.lowPercent}% đánh giá 1-2 sao</span>}
                {trend != null && (
                  <span className={`insight-pill ${trend >= 0 ? "insight-pill--good" : "insight-pill--danger"}`}>
                    {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)} điểm so với 30 ngày trước
                  </span>
                )}
                {trend == null && s.recentCount > 0 && (
                  <span className="insight-pill insight-pill--muted">30 ngày qua: {s.recentCount} đánh giá (chưa có kỳ trước để so)</span>
                )}
              </div>
            </div>

            <div className="insight-dist">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = s.distribution[n - 1];
                return (
                  <div className="insight-dist__row" key={n}>
                    <span className="insight-dist__label">{n}★</span>
                    <div className="insight-dist__track">
                      <div className="insight-dist__fill" style={{ width: `${(c / total) * 100}%` }} />
                    </div>
                    <span className="insight-dist__num">{c}</span>
                  </div>
                );
              })}
            </div>

            <div className="insight-ai">
              <button
                type="button"
                className="insight-ai__btn"
                onClick={() => analyze(s.productId)}
                disabled={state.loading || !canAnalyze}
                title={canAnalyze ? "" : "Cần ít nhất 3 đánh giá đã duyệt có nội dung"}
              >
                {state.loading ? "Đang phân tích..." : state.data ? "✨ Phân tích lại" : "✨ Phân tích AI"}
              </button>
              {!canAnalyze && <span className="insight-ai__hint">Cần ≥ 3 đánh giá có nội dung để phân tích.</span>}
            </div>

            {state.error && <p className="insight-ai__error">{state.error}</p>}

            {state.data && (
              <div className="insight-ai__result">
                <p className="insight-ai__summary">{state.data.summary}</p>
                <div className="insight-ai__cols">
                  <div>
                    <p className="insight-ai__title insight-ai__title--good">👍 Khách khen</p>
                    {state.data.strengths.length === 0 ? (
                      <p className="insight-ai__empty">Chưa nổi bật điểm nào.</p>
                    ) : (
                      <ul>{state.data.strengths.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    )}
                  </div>
                  <div>
                    <p className="insight-ai__title insight-ai__title--bad">👎 Khách chê</p>
                    {state.data.weaknesses.length === 0 ? (
                      <p className="insight-ai__empty">Không có phàn nàn đáng kể.</p>
                    ) : (
                      <ul>{state.data.weaknesses.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    )}
                  </div>
                </div>
                <p className="insight-ai__foot">Dựa trên {state.data.reviewCount} đánh giá gần nhất có nội dung.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}