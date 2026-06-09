import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ReviewSection.css';

const Stars = ({ value, onChange, size = 20 }) => (
  <div className="star-picker" style={{ fontSize: size }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`star-pick ${s <= value ? 'filled' : ''}`}
        onClick={() => onChange && onChange(s)}
        style={{ cursor: onChange ? 'pointer' : 'default' }}
      >★</span>
    ))}
  </div>
);

const RATING_LABELS = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Xuất sắc!' };

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('-createdAt');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await reviewsAPI.getByProduct(productId, { sort, page, limit: 8 });
      setReviews(res.data || []);
      setDistribution(res.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast.error('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  }, [productId, sort]);

  useEffect(() => { load(1); }, [load]);

  const totalReviews = pagination.total;
  const avgRating = totalReviews > 0
    ? Object.entries(distribution).reduce((sum, [stars, count]) => sum + Number(stars) * count, 0) / totalReviews
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Vui lòng nhập bình luận'); return; }
    setSubmitting(true);
    try {
      await reviewsAPI.create(productId, { rating, comment });
      toast.success('🎉 Cảm ơn bạn đã đánh giá!');
      setShowForm(false);
      setComment('');
      setRating(5);
      load(1);
    } catch (err) {
      toast.error(err.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      await reviewsAPI.update(id, { rating: editRating, comment: editComment });
      toast.success('Đã cập nhật đánh giá');
      setEditId(null);
      load(pagination.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      await reviewsAPI.delete(id);
      toast.success('Đã xóa đánh giá');
      load(1);
    } catch (err) { toast.error(err.message); }
  };

  const handleLike = async (id) => {
    if (!user) { toast('Đăng nhập để thích đánh giá 💕'); return; }
    try {
      const res = await reviewsAPI.like(id);
      setReviews((prev) => prev.map((r) =>
        r._id === id ? { ...r, likes: res.likes } : r
      ));
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="review-section">
      {/* Header */}
      <div className="review-header">
        <h3 className="review-title">💬 Đánh giá & Bình luận</h3>
        {user ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Đóng' : '✍️ Viết đánh giá'}
          </button>
        ) : (
          <Link to="/login" className="btn btn-outline btn-sm">🔐 Đăng nhập để đánh giá</Link>
        )}
      </div>

      {/* Rating overview */}
      {totalReviews > 0 && (
        <div className="review-overview">
          <div className="review-overview__score">
            <div className="review-overview__avg">{avgRating.toFixed(1)}</div>
            <div className="review-overview__stars">
              <Stars value={Math.round(avgRating)} size={22} />
            </div>
            <div className="review-overview__count">{totalReviews} đánh giá</div>
          </div>
          <div className="review-overview__bars">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="review-bar">
                <span className="review-bar__label">{s}★</span>
                <div className="review-bar__track">
                  <div
                    className="review-bar__fill"
                    style={{ width: totalReviews ? `${(distribution[s] / totalReviews) * 100}%` : '0%', background: s >= 4 ? 'var(--green)' : s === 3 ? 'var(--amber)' : 'var(--red)' }}
                  />
                </div>
                <span className="review-bar__count">{distribution[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="review-form scale-in">
          <h4 className="review-form__title">✍️ Chia sẻ cảm nhận của bạn</h4>

          <div className="review-form__rating">
            <label className="review-form__label">Đánh giá của bạn</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`rating-star ${s <= (hoverRating || rating) ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >★</span>
              ))}
              <span className="rating-label">{RATING_LABELS[hoverRating || rating]}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="review-form__label">Bình luận của bạn *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Món ăn có ngon không? Dịch vụ như thế nào? Bạn có muốn quay lại không?..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              style={{ resize: 'vertical' }}
              required
            />
            <span className="review-form__count">{comment.length}/1000</span>
          </div>

          <div className="review-form__actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner spinner-sm" /> Đang gửi...</> : '🚀 Gửi đánh giá'}
            </button>
          </div>
        </form>
      )}

      {/* Sort + list */}
      {totalReviews > 0 && (
        <div className="review-toolbar">
          <span className="review-toolbar__total">{totalReviews} đánh giá</span>
          <select className="form-select review-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-createdAt">Mới nhất</option>
            <option value="-rating">Điểm cao nhất</option>
            <option value="rating">Điểm thấp nhất</option>
            <option value="-likes">Nhiều lượt thích</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : reviews.length === 0 ? (
        <div className="review-empty">
          <div className="review-empty__icon">💭</div>
          <p className="review-empty__text">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <>
          <div className="review-list">
            {reviews.map((r, i) => (
              <div key={r._id} className="review-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                {editId === r._id ? (
                  /* Edit mode */
                  <div className="review-edit">
                    <div className="rating-input">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`rating-star ${s <= editRating ? 'active' : ''}`} onClick={() => setEditRating(s)}>★</span>
                      ))}
                    </div>
                    <textarea className="form-input" rows={3} value={editComment} onChange={(e) => setEditComment(e.target.value)} style={{ marginTop: 10, resize: 'vertical' }} />
                    <div className="review-edit__actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Hủy</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(r._id)}>💾 Lưu</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Review header */}
                    <div className="review-card__header">
                      <div className="review-card__avatar">
                        {r.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="review-card__meta">
                        <div className="review-card__name">
                          {r.name}
                          {r.isVerified && <span className="review-verified">✓ Đã mua hàng</span>}
                        </div>
                        <div className="review-card__sub">
                          <Stars value={r.rating} size={14} />
                          <span className="review-card__time">{timeAgo(r.createdAt)}</span>
                        </div>
                      </div>
                      {/* Edit/Delete nếu là chủ */}
                      {user && (user._id === r.user || user.role === 'admin' || user.role === 'staff') && (
                        <div className="review-card__actions">
                          {user._id === r.user && (
                            <button className="review-action-btn" title="Sửa"
                              onClick={() => { setEditId(r._id); setEditRating(r.rating); setEditComment(r.comment); }}>
                              ✏️
                            </button>
                          )}
                          <button className="review-action-btn review-action-btn--del" title="Xóa"
                            onClick={() => handleDelete(r._id)}>🗑️</button>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    <p className="review-card__comment">{r.comment}</p>

                    {/* Footer: likes */}
                    <div className="review-card__footer">
                      <button className="review-like-btn" onClick={() => handleLike(r._id)}>
                        ❤️ Hữu ích ({r.likes || 0})
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="review-pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`review-page-btn ${pagination.page === p ? 'active' : ''}`}
                  onClick={() => load(p)}
                >{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
