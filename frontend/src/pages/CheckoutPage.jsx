import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, momoAPI } from '../api';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const FLAT_DELIVERY_FEE = 15000;

const ORDER_TYPES = [
  { value: 'dine_in',  label: '🪑 Ăn tại quán', desc: 'Ngồi tại bàn' },
  { value: 'delivery', label: '🛵 Giao tận nơi', desc: 'Ship đến nhà'  },
];

const PAYMENT_METHODS = [
  { value: 'cash',    icon: '💵', label: 'Tiền mặt',  sub: 'Thanh toán tại quán' },
  { value: 'momo', icon: 'momo', label: 'MoMo', sub: 'Ví điện tử · Thẻ · QR' },
];

// ── Modal thanh toán MoMo ──────────────────────────────────
function MoMoModal({ qrCode, orderUrl, orderId, orderNumber, total, onSuccess, onClose }) {
  const [status, setStatus] = useState('waiting'); // waiting | checking | paid | failed
  const intervalRef = useRef(null);

  // Bắt đầu polling mỗi 3 giây
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await momoAPI.check(orderId);
        if (res.data?.paid) {
          clearInterval(intervalRef.current);
          setStatus('paid');
          setTimeout(() => onSuccess(), 1200);
        }
      } catch {/* ignore poll errors */}
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [orderId, onSuccess]);

  const openApp = () => {
    window.open(orderUrl, '_blank');
  };

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-modal momo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qr-modal__close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="qr-modal__header">
          <div className="momo-modal__brand">
            <span className="momo-logo"></span>
            <div>
              <div className="qr-modal__title">Thanh toán qua MoMo</div>
              <div className="momo-modal__sub">Quét QR hoặc mở app MoMo</div>
            </div>
          </div>
        </div>

        {/* Status: Đang chờ / Đã thanh toán */}
        {status === 'paid' ? (
          <div className="momo-paid">
            <div className="momo-paid__icon">✅</div>
            <div className="momo-paid__title">Thanh toán thành công!</div>
            <div className="momo-paid__sub">Đang chuyển đến trang theo dõi đơn...</div>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="qr-modal__body">
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={220} style={{ display: 'block', margin: '0 auto' }} />
              ) : (
                <div className="momo-noqr">
                  <span>
                
                  </span>
                  <p>Mở app MoMo để thanh toán</p>
                </div>
              )}
            </div>

            {/* Thông tin đơn */}
            <div className="qr-modal__info">
              <div className="qr-info-row">
                <span className="qr-info-label">Mã đơn hàng</span>
                <span className="qr-info-value qr-info-value--mono">{orderNumber}</span>
              </div>
              <div className="qr-info-row qr-info-row--amount">
                <span className="qr-info-label">Số tiền</span>
                <span className="qr-info-value qr-info-value--price">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Trạng thái polling */}
            <div className="momo-polling">
              <span className="spinner spinner-sm" />
              <span>Đang chờ xác nhận thanh toán...</span>
            </div>

            <div className="qr-modal__note">
              📱 Mở app MoMo → Quét mã QR · Tự động xác nhận sau khi thanh toán
            </div>

            <div className="qr-modal__actions">
              <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
              <button className="btn btn-primary momo-btn" onClick={openApp}>
                {}Mở MoMo App
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Trang Checkout ────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [loading, setLoading]   = useState(false);
  const [momoModal, setMomoModal] = useState(null); // { qrCode, orderUrl, orderId, orderNumber }
  const [savedTotal, setSaved]  = useState(0);

  const [orderType, setOrderType]   = useState('dine_in');
  const [paymentMethod, setPayment] = useState('cash');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', tableNumber: '', note: '' });

  useEffect(() => {
    if (user) setForm((p) => ({ ...p, name: user.name || '', phone: user.phone || '', email: user.email || '' }));
  }, [user]);

  useEffect(() => {
    if (items.length === 0 && !momoModal) navigate('/cart');
  }, [items.length, momoModal, navigate]);

  const deliveryFee = orderType === 'delivery' ? FLAT_DELIVERY_FEE : 0;
  const total       = totalPrice + deliveryFee;

  if (items.length === 0 && !momoModal) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return false;
    }
    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return false;
    }
    const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567)');
      return false;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (orderType === 'delivery' && !form.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng');
      return false;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng trống, vui lòng thêm món');
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    customer:      { name: form.name, phone: form.phone, email: form.email, address: form.address },
    items:         items.map((i) => ({ product: i._id, quantity: i.quantity })),
    orderType, tableNumber: form.tableNumber, note: form.note,
    paymentMethod, deliveryFee,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Bước 1: Tạo đơn hàng
      const orderRes = await ordersAPI.create(buildPayload());
      // interceptor unwrap: orderRes = { success, data: order }
      const order = orderRes.data;

      console.log('[MoMo debug] order:', order);

      if (!order?._id) {
        toast.error('Không lấy được thông tin đơn hàng. Thử lại!');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'momo') {
        // Bước 2: Tạo giao dịch MoMo
        let zlpData;
        try {
          const zlpRes = await momoAPI.create(order._id);
          // interceptor unwrap: zlpRes = { success, data: { orderUrl, qrCode, appTransId } }
          console.log('[MoMo debug] zlpRes:', zlpRes);
          zlpData = zlpRes.data ?? zlpRes; // fallback nếu unwrap khác tầng
        } catch (zlpErr) {
          console.error('[MoMo create error]', zlpErr);
          toast.error('MoMo lỗi: ' + (zlpErr.message || 'Không xác định'));
          setLoading(false);
          navigate(`/order/${order._id}`);
          return;
        }

        const orderUrl = zlpData?.orderUrl;
        const qrCode   = zlpData?.qrCode || '';

        console.log('[MoMo debug] orderUrl:', orderUrl, '| qrCode:', qrCode);

        if (!orderUrl) {
          toast.error('MoMo không trả về link. Kiểm tra ngrok + BACKEND_URL trong .env!');
          setLoading(false);
          navigate(`/order/${order._id}`);
          return;
        }

        setSaved(total);
        clearCart();
        setMomoModal({ qrCode, orderUrl, orderId: order._id, orderNumber: order.orderNumber, total });
      } else {
        clearCart();
        toast.success('🎉 Đặt hàng thành công!');
        navigate(`/order/${order._id}`);
      }
    } catch (err) {
      console.error('[handleSubmit error]', err);
      toast.error(err.message || 'Đặt hàng thất bại, thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleZlpSuccess = () => {
    toast.success('🎉 Thanh toán thành công!');
    navigate(`/order/${momoModal.orderId}`);
  };

  const handleZlpClose = () => {
    // Đơn đã tạo rồi, chỉ đóng modal — user có thể thanh toán sau
    if (momoModal) {
      toast('Đơn hàng đã được tạo. Bạn có thể thanh toán sau trong mục Đơn hàng của tôi.', { icon: 'ℹ️' });
      navigate(`/order/${momoModal.orderId}`);
    }
    setMomoModal(null);
  };

  return (
    <div className="checkout-page" style={{ paddingTop: 70 }}>
      <div className="container checkout-page__inner">

        {/* MoMo Modal */}
        {momoModal && (
          <MoMoModal
            {...momoModal}
            total={savedTotal}
            onSuccess={handleZlpSuccess}
            onClose={handleZlpClose}
          />
        )}

        {/* User banner */}
        {user && (
          <div className="checkout-user-banner">
            <span className="checkout-user-avatar">{user.name?.[0]?.toUpperCase()}</span>
            <div>
              <div className="checkout-user-name">Xin chào, <strong>{user.name}</strong> 👋</div>
              <div className="checkout-user-email">Thông tin đã được điền tự động từ tài khoản của bạn</div>
            </div>
          </div>
        )}

        <h1 className="checkout-page__title">📋 Xác nhận đơn hàng</h1>

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-form">

            {/* Hình thức */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">Hình thức đặt hàng</h3>
              <div className="order-type-grid">
                {ORDER_TYPES.map((t) => (
                  <button key={t.value} type="button"
                    className={`order-type-btn ${orderType === t.value ? 'active' : ''}`}
                    onClick={() => setOrderType(t.value)}>
                    <span className="order-type-btn__label">{t.label}</span>
                    <span className="order-type-btn__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
              {orderType === 'delivery' && (
                <div className="delivery-notice">
                  <div className="delivery-notice__row">
                    <span className="delivery-notice__icon">🛵</span>
                    <div>
                      <div className="delivery-notice__fee">Phí giao hàng cố định: <strong>{formatPrice(FLAT_DELIVERY_FEE)}</strong></div>
                      <div className="delivery-notice__limit">⚠️ Chỉ giao trong bán kính <strong>10 km</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin khách hàng */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">Thông tin khách hàng</h3>
              <div className="checkout-form__grid">
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="0901 234 567" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className="form-input" />
                </div>
                {orderType === 'dine_in' && (
                  <div className="form-group">
                    <label className="form-label">Số bàn</label>
                    <input name="tableNumber" value={form.tableNumber} onChange={handleChange} placeholder="Ví dụ: Bàn 5" className="form-input" />
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Địa chỉ giao hàng *</label>
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Số nhà, đường, phường, quận..." className="form-input" required />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Ghi chú</label>
                  <textarea name="note" value={form.note} onChange={handleChange}
                    placeholder="Yêu cầu đặc biệt, dị ứng thức ăn..." className="form-input" rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Thanh toán */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">Phương thức thanh toán</h3>
              <div className="payment-grid">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.value} type="button"
                    className={`payment-btn ${paymentMethod === m.value ? 'active' : ''} ${m.value === 'momo' ? 'payment-btn--momo' : ''}`}
                    onClick={() => setPayment(m.value)}>
                    <span className="payment-btn__icon">{m.icon}</span>
                    <span className="payment-btn__label">{m.label}</span>
                    <span className="payment-btn__sub">{m.sub}</span>
                  </button>
                ))}
              </div>

              {/* MoMo info card */}
              {paymentMethod === 'momo' && (
                <div className="momo-info-card">
                  <div className="momo-info-card__row">
                    <span className="momo-info-card__icon"></span>
                    <div>
                      <div className="momo-info-card__title">Thanh toán an toàn qua MoMo</div>
                      <div className="momo-info-card__desc">
                        Hỗ trợ: Ví MoMo · Thẻ ATM · Thẻ Visa/Mastercard · QR Pay
                      </div>
                    </div>
                  </div>
                  <div className="momo-info-card__steps">
                    <span>1️⃣ Bấm "Xác nhận đặt hàng"</span>
                    <span>2️⃣ Quét QR hoặc mở app MoMo</span>
                    <span>3️⃣ Xác nhận thanh toán — tự động cập nhật đơn</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="checkout-summary">
            <div className="checkout-summary__card">
              <h3 className="checkout-summary__title">Đơn hàng của bạn</h3>
              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item._id} className="checkout-item">
                    <img src={item.image || ''} alt={item.name} className="checkout-item__img"
                      onError={(e) => (e.target.style.display = 'none')} />
                    <div className="checkout-item__info">
                      <span className="checkout-item__name">{item.name}</span>
                      <span className="checkout-item__qty">×{item.quantity}</span>
                    </div>
                    <span className="checkout-item__price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary__divider" />
              <div className="checkout-summary__rows">
                <div className="checkout-summary__row">
                  <span>Tạm tính</span><span>{formatPrice(totalPrice)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="checkout-summary__row">
                    <span>Phí giao hàng</span><span>{formatPrice(FLAT_DELIVERY_FEE)}</span>
                  </div>
                )}
                <div className="checkout-summary__row checkout-summary__row--total">
                  <span>Tổng cộng</span>
                  <span className="price">{formatPrice(total)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading
                  ? <><span className="spinner spinner-sm" /> Đang xử lý...</>
                  : paymentMethod === 'momo'
                    ? <>{}Thanh toán qua MoMo</>
                    : '✓ Xác nhận đặt hàng'}
              </button>

              {paymentMethod === 'momo' && (
                <p className="checkout-qr-note">
                  🔒 Thanh toán bảo mật · Dữ liệu mã hoá SSL
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
