import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import "../Products/Products.css";

const CATEGORIES = ["Tất cả", "Mẹo trang trí", "Bảo quản gỗ", "Xu hướng nội thất", "Câu chuyện thương hiệu"];
const PAGE_SIZE = 6;

const BlogPosts = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("adminUser");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "Admin";

  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [page, setPage]       = useState(1);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      // Dùng /BlogPosts/all để Admin xem được cả bài nháp (chưa đăng công khai)
      const res = await api.get("/BlogPosts/all");
      setPosts(res.data);
    } catch {
      setError("Không thể tải danh sách bài viết. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleTogglePublish = async (post) => {
    const actionText = post.isPublished ? "chuyển về nháp (ẩn khỏi Client)" : "xuất bản (hiện công khai)";
    if (!window.confirm(`Bạn có chắc muốn ${actionText} bài viết "${post.title}" không?`)) return;
    try {
      await api.put(`/BlogPosts/${post.id}`, { ...post, isPublished: !post.isPublished });
      await fetchPosts();
    } catch {
      alert("Lỗi khi cập nhật trạng thái bài viết!");
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Xoá HẲN bài viết "${post.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/BlogPosts/${post.id}`);
      await fetchPosts();
    } catch {
      alert("Lỗi khi xoá bài viết!");
    }
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "Tất cả" || p.category === category;
    return matchSearch && matchCat;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

  return (
    <div className="products-page">

      <div className="products-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-tabs">
            {CATEGORIES.map(c => (
              <button key={c}
                className={`filter-tab ${category === c ? "filter-tab--active" : ""}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >{c}</button>
            ))}
          </div>
        </div>
        <button className="btn-add" onClick={() => navigate("/blogposts/create")}>
          + Viết bài mới
        </button>
      </div>

      {error && (
        <div className="error-box">
          ⚠️ {error}
          <button onClick={fetchPosts}>Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="loading-box">
          <div className="spinner" /><p>Đang tải bài viết...</p>
        </div>
      ) : (
        <>
          <div className="products-summary">
            Hiển thị <strong>{paginated.length}</strong> / <strong>{filtered.length}</strong> bài viết
            {posts.length > 0 && <span> (tổng {posts.length} trong DB)</span>}
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bài viết</th>
                    <th>Chủ đề</th>
                    <th>Tác giả</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} className="empty-row">Không tìm thấy bài viết nào</td></tr>
                  ) : paginated.map(p => (
                    <tr key={p.id} className={!p.isPublished ? "row--hidden" : ""}>
                      <td>
                        <div className="product-cell">
                          <div className="product-cell__img">
                            {p.thumbnail ? <img src={p.thumbnail} alt={p.title} /> : "📝"}
                          </div>
                          <div>
                            <p className="product-cell__name">{p.title}</p>
                            <p className="product-cell__id">#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="category-tag">{p.category || "—"}</span></td>
                      <td>{p.author || "LuxWood"}</td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td>
                        {p.isPublished
                          ? <span className="badge badge--success">Đã đăng</span>
                          : <span className="badge badge--muted">Nháp</span>}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => navigate(`/blogposts/edit/${p.id}`)}>✏️ Sửa</button>
                          <button
                            className={p.isPublished ? "btn-del" : "btn-restore"}
                            onClick={() => handleTogglePublish(p)}
                          >
                            {p.isPublished ? "🙈 Ẩn" : "📢 Đăng"}
                          </button>
                          {isAdmin && (
                            <button className="btn-del" onClick={() => handleDelete(p)}>🗑️ Xoá</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`page-btn ${n === page ? "page-btn--active" : ""}`}
                    onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BlogPosts;
