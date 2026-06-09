import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import ReviewSection from '../components/ReviewSection';
import './ProductDetailPage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const Stars = ({ rating, count }) => {
  if (!count || count === 0) {
    return (
      <div className="detail-stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ color: 'var(--border)', fontSize: 20 }}>★</span>
        ))}
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8, fontStyle: 'italic' }}>
          Chưa có đánh giá
        </span>
      </div>
    );
  }
  return (
    <div className="detail-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? 'var(--amber)' : 'var(--border)', fontSize: 20 }}>★</span>
      ))}
      <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>
        {rating.toFixed(1)} · {count} đánh giá
      </span>
    </div>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    productsAPI.getById(id)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error('Không tìm thấy món ăn'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    toast.success(`Đã thêm ${quantity}× ${product.name} vào giỏ!`);
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate('/cart');
  };

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ paddingTop: 70 }}>
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ paddingTop: 70 }}>
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-icon">😕</div>
          <div className="empty-title">Không tìm thấy món ăn</div>
          <Link to="/menu" className="btn btn-primary">Quay lại thực đơn</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page" style={{ paddingTop: 70 }}>
      {/* Breadcrumb */}
      <div className="detail-breadcrumb container">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/menu">Thực đơn</Link>
        <span>/</span>
        <Link to={`/menu/${product.category?.slug}`}>{product.category?.name}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="container detail-layout">
        {/* Image */}
        <div className="detail-image-wrap">
          {!imgError ? (
            <img
              src={product.image || ''}
              alt={product.name}
              className="detail-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="detail-image-fallback">🍽️</div>
          )}
          {discount > 0 && (
            <div className="detail-discount-badge">-{discount}%</div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info fade-in">
          <div className="detail-category">
            {product.category?.icon} {product.category?.name}
          </div>

          <h1 className="detail-name">{product.name}</h1>

          <Stars rating={product.rating?.average || 0} count={product.rating?.count || 0} />

          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="price-original" style={{ fontSize: 16 }}>{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          {product.description && (
            <p className="detail-desc">{product.description}</p>
          )}

          <div className="detail-meta-row">
            <div className="detail-meta-item">
              <span className="detail-meta-icon">⏱️</span>
              <div>
                <div className="detail-meta-label">Thời gian nấu</div>
                <div className="detail-meta-value">{product.preparationTime} phút</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📦</span>
              <div>
                <div className="detail-meta-label">Tình trạng</div>
                <div className="detail-meta-value" style={{ color: product.isAvailable ? 'var(--green)' : 'var(--red)' }}>
                  {product.isAvailable ? '✓ Còn món' : '✗ Hết món'}
                </div>
              </div>
            </div>
            {product.rating?.count > 0 && (
              <div className="detail-meta-item">
                <span className="detail-meta-icon">⭐</span>
                <div>
                  <div className="detail-meta-label">Đánh giá</div>
                  <div className="detail-meta-value">
                    {product.rating.average.toFixed(1)} / 5 ({product.rating.count} người)
                  </div>
                </div>
              </div>
            )}
          </div>

          {product.tags?.length > 0 && (
            <div className="detail-tags">
              {product.tags.map((tag) => (
                <span key={tag} className="badge badge-amber">{tag}</span>
              ))}
            </div>
          )}

          {/* Quantity & add to cart */}
          <div className="detail-qty-row">
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span className="qty-value" style={{ fontSize: 18 }}>{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              = {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="detail-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAdd}
              disabled={!product.isAvailable}
              style={{ flex: 1 }}
            >
              🛒 Thêm vào giỏ
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={handleBuyNow}
              disabled={!product.isAvailable}
              style={{ flex: 1 }}
            >
              ⚡ Mua ngay
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="container" style={{ paddingBottom: 80 }}>
        <ReviewSection productId={id} />
      </div>
    </div>
  );
}
