import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 70 }}>
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Giỏ hàng trống</div>
          <p className="empty-desc">Hãy thêm những món ăn yêu thích vào giỏ nhé!</p>
          <Link to="/menu" className="btn btn-primary btn-lg">Xem thực đơn</Link>
        </div>
      </div>
    );
  }



  return (
    <div className="cart-page" style={{ paddingTop: 70 }}>
      <div className="container cart-page__inner">
        {/* Header */}
        <div className="cart-page__header">
          <h1 className="cart-page__title">🛒 Giỏ hàng</h1>
          <button className="btn btn-ghost btn-sm" onClick={clearCart}>
            🗑️ Xoá tất cả
          </button>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item._id} className="cart-item fade-in">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100'}
                  alt={item.name}
                  className="cart-item__image"
                  onError={(e) => { e.target.style.display='none'; }}
                />
                <div className="cart-item__info">
                  <h3 className="cart-item__name">{item.name}</h3>
                  {item.category?.name && (
                    <span className="cart-item__cat">{item.category.icon} {item.category.name}</span>
                  )}
                  <span className="price cart-item__price">{formatPrice(item.price)}</span>
                </div>
                <div className="cart-item__controls">
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >+</button>
                  </div>
                  <span className="cart-item__subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    className="cart-item__remove"
                    onClick={() => removeItem(item._id)}
                    aria-label="Remove"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <div className="cart-summary__card">
              <h3 className="cart-summary__title">Tóm tắt đơn hàng</h3>
              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Tạm tính ({items.length} món)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="cart-summary__row" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span>Phí giao hàng</span>
                  <span>Tính ở bước đặt hàng</span>
                </div>
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Tổng cộng</span>
                  <span className="price">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => {
            if (!user) {
              toast('🔐 Vui lòng đăng nhập để đặt hàng', { icon: '👤' });
              navigate('/login', { state: { from: '/checkout' } });
            } else {
              navigate('/checkout');
            }
          }}
              >
                Tiến hành đặt hàng →
              </button>
              <Link to="/menu" className="btn btn-ghost btn-full" style={{ marginTop: 8, justifyContent: 'center' }}>
                ← Tiếp tục mua sắm
              </Link>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
