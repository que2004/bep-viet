import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './OrderHistoryPage.css';

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

const ORDER_TYPE_LABEL = {
  dine_in:  '🪑 Ăn tại quán',
  delivery: '🛵 Giao hàng',
};

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending',   label: '📋 Chờ xác nhận' },
  { value: 'cooking',   label: '👨‍🍳 Đang nấu' },
  { value: 'delivering',label: '🛵 Đang giao' },
  { value: 'completed', label: '🎉 Hoàn thành' },
  { value: 'cancelled', label: '❌ Đã hủy' },
];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [expanded, setExpanded] = useState(null); // mã đơn đang mở chi tiết

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await ordersAPI.getMyOrders({ page, limit: 8, status: statusFilter });
      setOrders(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="oh-page" style={{ paddingTop: 90, minHeight: '80vh', paddingBottom: 80 }}>
      <div className="container">

        {/* Header */}
        <div className="oh-header">
          <div>
            <h1 className="oh-title">Lịch sử đặt hàng</h1>
            <p className="oh-sub">Xin chào <strong>{user?.name}</strong> — bạn có {pagination.total} đơn hàng</p>
          </div>
          <Link to="/menu" className="btn btn-primary">🍜 Đặt thêm</Link>
        </div>

        {/* Filter tabs */}
        <div className="oh-filters">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value}
              className={`oh-filter-btn ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <div className="empty-title">Chưa có đơn hàng nào</div>
            <div className="empty-desc">Hãy khám phá thực đơn và đặt món ngay!</div>
            <Link to="/menu" className="btn btn-primary" style={{ marginTop: 16 }}>
              Xem thực đơn
            </Link>
          </div>
        ) : (
          <div className="oh-list">
            {orders.map((order) => {
              const sm = STATUS_META[order.status] || {};
              const isOpen = expanded === order._id;

              return (
                <div key={order._id} className="oh-card">
                  {/* Card header — luôn hiển thị */}
                  <div className="oh-card__top" onClick={() => toggleExpand(order._id)}>
                    <div className="oh-card__left">
                      <div className="oh-card__num">{order.orderNumber}</div>
                      <div className="oh-card__meta">
                        <span>{ORDER_TYPE_LABEL[order.orderType]}</span>
                        <span className="oh-dot">·</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div className="oh-card__items-preview">
                        {order.items.slice(0, 2).map((it, i) => (
                          <span key={i} className="oh-item-chip">
                            {it.name} ×{it.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="oh-item-chip oh-item-chip--more">
                            +{order.items.length - 2} món
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="oh-card__right">
                      <span className="oh-status-badge"
                        style={{ background: sm.bg, color: sm.color }}>
                        {sm.icon} {sm.label}
                      </span>
                      <div className="oh-total">{formatPrice(order.total)}</div>
                      <span className="oh-chevron">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Chi tiết đơn — mở rộng khi bấm */}
                  {isOpen && (
                    <div className="oh-card__detail">
                      <div className="oh-detail-items">
                        <div className="oh-detail-title">Chi tiết món</div>
                        {order.items.map((item, i) => (
                          <div key={i} className="oh-detail-item">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="oh-detail-img"
                                onError={(e) => (e.target.style.display = 'none')} />
                            )}
                            <div className="oh-detail-item-info">
                              <span className="oh-detail-item-name">{item.name}</span>
                              <span className="oh-detail-item-qty">×{item.quantity}</span>
                            </div>
                            <span className="oh-detail-item-price">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="oh-detail-summary">
                        <div className="oh-summary-row">
                          <span>Tạm tính</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="oh-summary-row">
                            <span>Phí giao hàng</span>
                            <span>{formatPrice(order.deliveryFee)}</span>
                          </div>
                        )}
                        <div className="oh-summary-row oh-summary-row--total">
                          <span>Tổng cộng</span>
                          <span className="price">{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      <div className="oh-detail-info">
                        <div className="oh-detail-info-row">
                          <span>💳 Thanh toán</span>
                          <span>{order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                        </div>
                        {order.customer.address && (
                          <div className="oh-detail-info-row">
                            <span>📍 Địa chỉ</span>
                            <span>{order.customer.address}</span>
                          </div>
                        )}
                        {order.tableNumber && (
                          <div className="oh-detail-info-row">
                            <span>🪑 Số bàn</span>
                            <span>{order.tableNumber}</span>
                          </div>
                        )}
                        {order.note && (
                          <div className="oh-detail-info-row">
                            <span>📝 Ghi chú</span>
                            <span>{order.note}</span>
                          </div>
                        )}
                      </div>

                      <div className="oh-detail-actions">
                        <Link to={`/order/${order._id}`} className="btn btn-secondary btn-sm">
                          👁 Theo dõi đơn
                        </Link>
                        {['pending','confirmed'].includes(order.status) && (
                          <span className="oh-cancel-hint">
                            Liên hệ quán để hủy đơn: <strong>0886 215 808</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="oh-pagination">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p}
                className={`oh-page-btn ${pagination.page === p ? 'active' : ''}`}
                onClick={() => load(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
