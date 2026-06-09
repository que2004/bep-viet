import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import './OrderTrackingPage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const STATUS_STEPS = [
  { key: 'pending',    label: 'Chờ xác nhận', desc: 'Đơn hàng đang chờ nhà hàng xác nhận', icon: '📋' },
  { key: 'confirmed',  label: 'Đã xác nhận',  desc: 'Nhà hàng đã nhận đơn, chuẩn bị nấu', icon: '✅' },
  { key: 'cooking',    label: 'Đang nấu',      desc: 'Đầu bếp đang chế biến món ăn', icon: '👨‍🍳' },
  { key: 'cooked',     label: 'Đã nấu xong',   desc: 'Món ăn đã sẵn sàng', icon: '🍱' },
  { key: 'delivering', label: 'Đang giao',      desc: 'Shipper đang trên đường giao đến bạn', icon: '🛵' },
  { key: 'delivered',  label: 'Đã giao',        desc: 'Đơn hàng đã được giao đến nơi', icon: '📦' },
  { key: 'completed',  label: 'Hoàn thành',     desc: 'Cảm ơn bạn đã sử dụng dịch vụ!', icon: '🎉' },
];
const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    try {
      const res = await ordersAPI.getById(id);
      setOrder(res.data);
    } catch {
      setError('Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // Poll every 30 seconds
    const interval = setInterval(loadOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const currentIdx = STATUS_ORDER.indexOf(order?.status);

  if (loading) {
    return (
      <div style={{ paddingTop: 70 }}>
        <div className="loading-container">
          <div className="spinner" />
          <div className="loading-text">Đang tải thông tin đơn hàng...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ paddingTop: 70 }}>
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-icon">😕</div>
          <div className="empty-title">Không tìm thấy đơn hàng</div>
          <Link to="/" className="btn btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="tracking-page" style={{ paddingTop: 70 }}>
      <div className="container tracking-page__inner">
        {/* Success banner */}
        <div className="tracking-success">
          <div className="tracking-success__icon">🎉</div>
          <div>
            <h1 className="tracking-success__title">Đặt hàng thành công!</h1>
            <p className="tracking-success__sub">
              Mã đơn hàng: <strong>{order.orderNumber}</strong>
            </p>
          </div>
        </div>

        <div className="tracking-layout">
          {/* Status tracker */}
          <div className="tracking-status-card">
            <h3 className="tracking-card-title">Trạng thái đơn hàng</h3>

            {isCancelled ? (
              <div className="tracking-cancelled">
                <span>❌</span>
                <span>Đơn hàng đã bị hủy</span>
              </div>
            ) : (
              <div className="tracking-steps">
                {STATUS_STEPS
                  .filter(step => {
                    if (order.orderType === 'dine_in' && (step.key === 'delivering' || step.key === 'delivered')) return false;
                    return true;
                  })
                  .map((step, i, arr) => {
                  const stepIdx = STATUS_ORDER.indexOf(step.key);
                  const isDone = stepIdx < currentIdx;
                  const isCurrent = step.key === order.status;
                  return (
                    <div key={step.key} className={`tracking-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="tracking-step__indicator">
                        <div className="tracking-step__icon">
                          {isDone ? '✓' : step.icon}
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`tracking-step__line ${isDone ? 'done' : ''}`} />
                        )}
                      </div>
                      <div className="tracking-step__text">
                        <div className="tracking-step__label">{step.label}</div>
                        <div className="tracking-step__desc">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tracking-eta">
              ⏱️ Thời gian dự kiến: <strong>~{order.estimatedTime} phút</strong>
            </div>
          </div>

          {/* Order details */}
          <div className="tracking-details">
            <div className="tracking-card">
              <h3 className="tracking-card-title">Thông tin khách hàng</h3>
              <div className="tracking-info-rows">
                <div className="tracking-info-row">
                  <span>👤 Tên</span><span>{order.customer.name}</span>
                </div>
                <div className="tracking-info-row">
                  <span>📞 SĐT</span><span>{order.customer.phone}</span>
                </div>
                {order.customer.address && (
                  <div className="tracking-info-row">
                    <span>📍 Địa chỉ</span><span>{order.customer.address}</span>
                  </div>
                )}
                <div className="tracking-info-row">
                  <span>🍽️ Hình thức</span>
                  <span>{order.orderType === 'dine_in' ? 'Ăn tại quán' : 'Giao hàng'}</span>
                </div>
                {order.tableNumber && (
                  <div className="tracking-info-row">
                    <span>🪑 Bàn số</span><span>{order.tableNumber}</span>
                  </div>
                )}
                <div className="tracking-info-row">
                  <span>💳 Thanh toán</span>
                  <span>{order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'momo' ? '🩷 MoMo' : order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : order.paymentMethod.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="tracking-card">
              <h3 className="tracking-card-title">Món đã đặt</h3>
              <div className="tracking-items">
                {order.items.map((item, i) => (
                  <div key={i} className="tracking-item">
                    <span className="tracking-item__qty">×{item.quantity}</span>
                    <span className="tracking-item__name">{item.name}</span>
                    <span className="tracking-item__price">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="tracking-total">
                <span>Tổng cộng</span>
                <span className="price">{formatPrice(order.total)}</span>
              </div>
            </div>

            {order.note && (
              <div className="tracking-card">
                <h3 className="tracking-card-title">Ghi chú</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{order.note}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/" className="btn btn-primary btn-lg">🏠 Về trang chủ</Link>
          <Link to="/menu" className="btn btn-secondary btn-lg" style={{ marginLeft: 12 }}>🍜 Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}
