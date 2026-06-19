import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI, ordersAPI } from '../api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './HomePage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const STATUS_META = {
  pending:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#FEF3C7', icon: '📋' },
  confirmed:  { label: 'Đã xác nhận',  color: '#3b82f6', bg: '#DBEAFE', icon: '✅' },
  cooking:    { label: 'Đang nấu',     color: '#8b5cf6', bg: '#EDE9FE', icon: '👨‍🍳' },
  cooked:     { label: 'Đã nấu',       color: '#06b6d4', bg: '#CFFAFE', icon: '🍱' },
  delivering: { label: 'Đang giao',    color: '#f97316', bg: '#FFEDD5', icon: '🛵' },
  delivered:  { label: 'Đã giao',      color: '#0ea5e9', bg: '#E0F2FE', icon: '📦' },
  completed:  { label: 'Hoàn thành',   color: '#22c55e', bg: '#DCFCE7', icon: '🎉' },
  cancelled:  { label: 'Đã hủy',       color: '#ef4444', bg: '#FEE2E2', icon: '❌' },
};

export default function HomePage() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsAPI.getFeatured(),
          categoriesAPI.getAll(),
        ]);
        setFeaturedProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      } catch {
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) { setRecentOrders([]); return; }
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await ordersAPI.getMyOrders({ page: 1, limit: 3 });
        setRecentOrders(res.data || []);
      } catch {
        setRecentOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [user]);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__pattern" />
          <div className="hero__blob hero__blob--1" />
          <div className="hero__blob hero__blob--2" />
          <div className="hero__blob hero__blob--3" />
        </div>
        <div className="container hero__content">
          <div className="hero__text fade-in">
            <div className="hero__eyebrow">🌸 Ẩm thực truyền thống Việt Nam</div>
            <h1 className="hero__title">
              Hương vị <em>đậm đà</em><br />
              từ bếp gia đình
            </h1>
            <p className="hero__subtitle">
              Mỗi món ăn là một câu chuyện, mỗi bữa cơm là hương vị quê hương.
              Thưởng thức hương vị quê nhà ngay tại bàn của bạn.
            </p>
            <div className="hero__actions">
              <Link to="/menu" className="btn btn-primary btn-lg">
                🍜 Xem thực đơn
              </Link>
              <a href="#featured" className="btn btn-outline btn-lg">
                ⭐ Món nổi bật
              </a>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-num">3</span>
                <span className="hero__stat-label">Miền đặc sản</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-num">30+</span>
                <span className="hero__stat-label">Món ăn</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-num">100%</span>
                <span className="hero__stat-label">Nguyên liệu tươi</span>
              </div>
            </div>
          </div>
          <div className="hero__image-wrap fade-in">
            <div className="hero__image-ring" />
            <img
              src="https://images.unsplash.com/photo-1576577445504-6af96477db52?w=600&h=700&fit=crop"
              alt="Phở Bò"
              className="hero__image"
            />
            <div className="hero__badge hero__badge--top">
              <span>🔥</span>
              <div>
                <div className="hero__badge-title">Hot nhất hôm nay</div>
                <div className="hero__badge-sub">Phở Bò Tái Nạm</div>
              </div>
            </div>
            <div className="hero__badge hero__badge--bottom">
              <span>⚡</span>
              <div>
                <div className="hero__badge-title">Giao hàng nhanh</div>
                <div className="hero__badge-sub">Trong 30 phút</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--surface)" />
          </svg>
        </div>
      </section>

      {/* Features bar */}
      <section className="features-bar">
        <div className="container features-bar__inner">
          {[
            { icon: '🚀', title: 'Giao hàng nhanh', desc: 'Trong vòng 30 phút' },
            { icon: '🌿', title: 'Nguyên liệu tươi', desc: 'Chọn lọc mỗi ngày' },
            { icon: '👨‍🍳', title: 'Đầu bếp chuyên nghiệp', desc: 'Am hiểu ẩm thực 3 miền' },
            { icon: '💳', title: 'Thanh toán linh hoạt', desc: 'Tiền mặt, chuyển khoản' },
          ].map((f) => (
            <div key={f.title} className="feature-item">
              <span className="feature-item__icon">{f.icon}</span>
              <div>
                <div className="feature-item__title">{f.title}</div>
                <div className="feature-item__desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section container">
        <div className="section-header">
          <div className="section-tag">📋 Danh mục</div>
          <h2 className="section-title">Khám phá thực đơn</h2>
          <p className="section-subtitle">Tinh hoa ẩm thực ba miền Bắc – Trung – Nam trong từng món ăn</p>
        </div>
        <div className="categories-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => (
                <div key={i} className="category-card skeleton" style={{ height: 100 }} />
              ))
            : categories.map((cat) => (
                <Link to={`/menu/${cat.slug}`} key={cat._id} className="category-card">
                  <span className="category-card__icon">{cat.icon}</span>
                  <span className="category-card__name">{cat.name}</span>
                </Link>
              ))
          }
        </div>
      </section>

      {/* Featured products */}
      <section className="featured-section container" id="featured">
        <div className="section-header">
          <div className="section-tag">⭐ Đặc biệt</div>
          <h2 className="section-title">Món nổi bật</h2>
          <p className="section-subtitle">Những món được yêu thích nhất tại Bếp Việt</p>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="product-card-skeleton">
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                  <div className="skeleton" style={{ height: 18, width: '90%' }} />
                  <div className="skeleton" style={{ height: 14, width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((p, i) => (
              <div key={p._id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <div className="empty-title">Chưa có món nổi bật</div>
          </div>
        )}

        <div className="featured-section__cta">
          <Link to="/menu" className="btn btn-primary btn-lg">
            Xem tất cả thực đơn →
          </Link>
        </div>
      </section>

      {/* Đơn hàng gần đây (chỉ hiển thị khi đã đăng nhập) */}
      {user && (
        <section className="recent-orders-section container">
          <div className="section-header">
            <div className="section-tag">📦 Của bạn</div>
            <h2 className="section-title">Đơn hàng gần đây</h2>
          </div>
          {ordersLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">🍽️</div>
              <div className="empty-title">Bạn chưa có đơn hàng nào</div>
              <Link to="/menu" className="btn btn-primary" style={{ marginTop: 12 }}>
                Đặt món ngay
              </Link>
            </div>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map((order) => {
                const sm = STATUS_META[order.status] || {};
                return (
                  <Link to={`/order/${order._id}`} key={order._id} className="recent-order-card">
                    <div className="recent-order-card__left">
                      <div className="recent-order-card__num">{order.orderNumber}</div>
                      <div className="recent-order-card__items">
                        {order.items.slice(0, 2).map((it, i) => (
                          <span key={i} className="oh-item-chip">{it.name} ×{it.quantity}</span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="oh-item-chip oh-item-chip--more">+{order.items.length - 2} món</span>
                        )}
                      </div>
                      <div className="recent-order-card__date">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="recent-order-card__right">
                      <span className="oh-status-badge" style={{ background: sm.bg, color: sm.color }}>
                        {sm.icon} {sm.label}
                      </span>
                      <div className="recent-order-card__total">{formatPrice(order.total)}</div>
                      <span className="recent-order-card__arrow">→</span>
                    </div>
                  </Link>
                );
              })}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/orders" className="btn btn-outline">Xem tất cả đơn hàng →</Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* About / Story */}
      <section className="story-section" id="about">
        <div className="container story-section__inner">
          <div className="story-section__image-wrap">
            <img
              src="https://www.bepxuadanang.com/wp-content/uploads/3105169131323974362139747424887302820006012n-900x900.jpg"
              alt="Bếp nhà hàng"
              className="story-section__image"
            />
          </div>
          <div className="story-section__text">
            <div className="section-tag">🌸 Câu chuyện của chúng tôi</div>
            <h2 className="section-title" style={{ textAlign: 'left', margin: '12px 0' }}>
              Bếp Việt –<br />Hương vị ba miền
            </h2>
            <p className="story-section__desc">
              Bếp Việt là quán ăn chuyên phục vụ các món ăn truyền thống của cả ba miền
              Bắc – Trung – Nam. Từ phở Hà Nội, bún bò Huế đến hủ tiếu Nam Vang,
              mỗi món đều được chế biến đúng hương vị vùng miền với nguyên liệu tươi
              chọn lọc mỗi ngày.
            </p>
            <p className="story-section__desc">
              Chúng tôi tin rằng ẩm thực là sợi dây kết nối con người với quê hương.
              Dù bạn đến từ miền nào, đều sẽ tìm thấy hương vị quen thuộc của gia đình
              tại Bếp Việt.
            </p>
            <div className="story-section__highlights">
              {['100% nguyên liệu tươi mỗi ngày', 'Công thức nấu ăn truyền thống', 'Đặc sản đủ cả 3 miền'].map((h) => (
                <div key={h} className="story-highlight">
                  <span className="story-highlight__check">✓</span>
                  {h}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
