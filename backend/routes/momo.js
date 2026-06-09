/**
 * MoMo Payment Routes (Sandbox)
 * Docs: https://developers.momo.vn/v3/docs/payment/api/qr-payment
 *
 * Endpoints:
 *   POST /api/momo/create   — Tạo giao dịch MoMo, trả về qrCodeUrl + deeplink
 *   POST /api/momo/callback — MoMo gọi về sau khi thanh toán
 *   POST /api/momo/check    — FE polling kiểm tra trạng thái
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const axios   = require('axios');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

// ── MoMo Sandbox config ───────────────────────────────────────
// Sandbox creds công khai từ: https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions
const MOMO = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey:   process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85',
  secretKey:   process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  endpoint:    process.env.MOMO_ENDPOINT     || 'https://test-payment.momo.vn/v2/gateway/api/create',
  queryEndpoint: process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query',
};

/** HMAC-SHA256 helper */
const hmacSHA256 = (data, key) =>
  crypto.createHmac('sha256', key).update(data).digest('hex');

// ── POST /api/momo/create ─────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (order.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán' });

    const requestId   = `${MOMO.partnerCode}_${Date.now()}`;
    const amount      = Math.round(order.total);
    const orderInfo   = `Bếp Việt - Thanh toán đơn ${order.orderNumber}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order._id}`;
    const ipnUrl      = `${process.env.BACKEND_URL  || 'http://localhost:5000'}/api/momo/callback`;
    const requestType = 'payWithMethod'; // hiện tất cả phương thức, kể cả QR
    const extraData   = Buffer.from(JSON.stringify({ orderId: order._id.toString() })).toString('base64');

    // Signature: HMAC-SHA256 theo đúng thứ tự MoMo quy định
    const rawSignature =
      `accessKey=${MOMO.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${requestId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${MOMO.partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = hmacSHA256(rawSignature, MOMO.secretKey);

    const payload = {
      partnerCode: MOMO.partnerCode,
      accessKey:   MOMO.accessKey,
      requestId,
      amount,
      orderId:     requestId,  // MoMo dùng orderId riêng, không phải MongoDB _id
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    const { data } = await axios.post(MOMO.endpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (data.resultCode !== 0) {
      console.error('[MoMo create] resultCode:', data.resultCode, data.message);
      return res.status(400).json({ success: false, message: data.message || 'MoMo từ chối giao dịch' });
    }

    // Lưu thông tin MoMo vào đơn hàng
    order.momo.appTransId  = requestId;
    order.momo.orderUrl    = data.payUrl   || '';
    order.momo.qrCode      = data.qrCodeUrl || '';
    order.paymentMethod       = 'momo';
    await order.save();

    res.json({
      success: true,
      data: {
        orderUrl: data.payUrl    || '',
        qrCode:   data.qrCodeUrl || '',
        requestId,
      },
    });
  } catch (err) {
    console.error('[MoMo create]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi kết nối MoMo: ' + err.message });
  }
});

// ── POST /api/momo/callback ───────────────────────────────────
// MoMo gọi về (IPN) sau khi thanh toán — không cần auth
router.post('/callback', async (req, res) => {
  console.log('[MoMo callback] body:', req.body);
  try {
    const {
      partnerCode, orderId, requestId, amount, orderInfo,
      orderType, transId, resultCode, message, payType,
      responseTime, extraData, signature,
    } = req.body;

    // Verify signature
    const rawSignature =
      `accessKey=${MOMO.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSig = hmacSHA256(rawSignature, MOMO.secretKey);
    if (expectedSig !== signature) {
      console.error('[MoMo callback] Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    if (resultCode !== 0) {
      console.log('[MoMo callback] Payment failed, resultCode:', resultCode);
      return res.json({ message: 'Payment failed' });
    }

    // Lấy orderId thật từ extraData
    const decoded  = JSON.parse(Buffer.from(extraData, 'base64').toString());
    const mongoId  = decoded.orderId;

    const order = await Order.findById(mongoId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus      = 'paid';
    order.momo.zpTransId  = String(transId);
    order.momo.returnCode = resultCode;
    order.momo.paidAt     = new Date(responseTime);

    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Thanh toán MoMo thành công - tự động xác nhận' });
    }

    await order.save();
    res.json({ message: 'success' });
  } catch (err) {
    console.error('[MoMo callback]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/momo/check ──────────────────────────────────────
// FE polling kiểm tra trạng thái
router.post('/check', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).select('paymentStatus momo orderNumber status');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, data: { paid: true, order } });
    }

    // Double-check với MoMo nếu chưa nhận callback
    if (order.momo.appTransId) {
      const requestId = `check_${Date.now()}`;
      const rawSig =
        `accessKey=${MOMO.accessKey}` +
        `&orderId=${order.momo.appTransId}` +
        `&partnerCode=${MOMO.partnerCode}` +
        `&requestId=${requestId}`;
      const signature = hmacSHA256(rawSig, MOMO.secretKey);

      const { data } = await axios.post(MOMO.queryEndpoint, {
        partnerCode: MOMO.partnerCode,
        accessKey:   MOMO.accessKey,
        requestId,
        orderId:     order.momo.appTransId,
        signature,
        lang: 'vi',
      }, { headers: { 'Content-Type': 'application/json' } });

      if (data.resultCode === 0) {
        order.paymentStatus = 'paid';
        order.momo.returnCode = data.resultCode;
        if (order.status === 'pending') {
          order.status = 'confirmed';
          order.statusHistory.push({ status: 'confirmed', note: 'Xác nhận qua polling MoMo' });
        }
        await order.save();
        return res.json({ success: true, data: { paid: true, order } });
      }
    }

    res.json({ success: true, data: { paid: false, order } });
  } catch (err) {
    console.error('[MoMo check]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
