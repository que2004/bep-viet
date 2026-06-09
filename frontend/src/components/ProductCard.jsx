import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const Stars = ({ rating }) => {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star ${s <= Math.round(rating) ? '' : 'empty'}`}>★</span>
      ))}
    </div>
  );
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem(product);
    toast.success(`Đã thêm ${product.name} vào giỏ!`);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      {/* Image */}
      <div className="product-card__image-wrap">
        {!imgError ? (
          <img
            src={product.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400'}
            alt={product.name}
            className="product-card__image"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-card__image-fallback">🍽️</div>
        )}

        {/* Badges */}
        <div className="product-card__badges">
          {discount > 0 && <span className="badge badge-red">-{discount}%</span>}
          {product.isNew && <span className="badge badge-green">Mới</span>}
          {product.isFeatured && <span className="badge badge-amber">⭐ Nổi bật</span>}
        </div>

        {/* Quick add overlay */}
        <div className="product-card__overlay">
          <button
            className={`product-card__add-btn ${adding ? 'adding' : ''}`}
            onClick={handleAdd}
          >
            {adding ? '✓ Đã thêm!' : '+ Thêm vào giỏ'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="product-card__info">
        <div className="product-card__category">
          {product.category?.icon} {product.category?.name}
        </div>

        <h3 className="product-card__name">{product.name}</h3>

        {product.description && (
          <p className="product-card__desc">{product.description}</p>
        )}

        <div className="product-card__meta">
          {/* Chỉ hiện rating khi đã có đánh giá thực */}
          {product.rating?.count > 0 ? (
            <div className="product-card__rating">
              <Stars rating={product.rating.average} />
              <span className="product-card__rating-count">
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </span>
            </div>
          ) : (
            <span className="product-card__no-rating">Chưa có đánh giá</span>
          )}
          <div className="product-card__time">⏱ {product.preparationTime} phút</div>
        </div>

        <div className="product-card__footer">
          <div className="product-card__prices">
            <span className="price">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="price-original">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <button
            className={`product-card__btn ${adding ? 'adding' : ''}`}
            onClick={handleAdd}
            aria-label="Add to cart"
          >
            {adding ? '✓' : '+'}
          </button>
        </div>
      </div>
    </Link>
  );
}
