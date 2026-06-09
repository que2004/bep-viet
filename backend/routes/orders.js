const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');
const { protect, adminOnly, adminOrStaff, staffAny } = require('../middleware/auth');

const ROLE_ALLOWED = {
  admin:   ['pending','confirmed','cooking','cooked','delivering','delivered','completed','cancelled'],
  staff:   ['pending','confirmed','cooking','cooked','delivering','delivered','completed','cancelled'],
  shipper: ['cooked','delivering','delivered','completed'],
};

// Luồng trạng thái theo hình thức đặt hàng
const NEXT_ALLOWED_DINE_IN = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['cooking',   'cancelled'],
  cooking:   ['cooked',    'cancelled'],
  cooked:    ['completed', 'cancelled'],  // bỏ qua delivering/delivered
  completed: [],
  cancelled: [],
};
const NEXT_ALLOWED_DELIVERY = {
  pending:    ['confirmed',  'cancelled'],
  confirmed:  ['cooking',    'cancelled'],
  cooking:    ['cooked',     'cancelled'],
  cooked:     ['delivering', 'cancelled'],
  delivering: ['delivered',  'cancelled'],
  delivered:  ['completed',  'cancelled'],
  completed:  [],
  cancelled:  [],
};

const getNextAllowed = (orderType) =>
  orderType === 'delivery' ? NEXT_ALLOWED_DELIVERY : NEXT_ALLOWED_DINE_IN;

const canTransition = (from, to, orderType) =>
  to === 'cancelled' || (getNextAllowed(orderType)[from] || []).includes(to);

const STATUS_LABELS = {
  pending:    'Chờ xác nhận',
  confirmed:  'Đã xác nhận',
  cooking:    'Đang nấu',
  cooked:     'Đã nấu',
  delivering: 'Đang giao',
  delivered:  'Đã giao',
  completed:  'Hoàn thành',
  cancelled:  'Đã hủy',
};

// POST /api/orders — Tạo đơn
router.post('/', protect, async (req, res) => {
  try {
    const { customer, items, orderType, tableNumber, note, paymentMethod, deliveryFee = 0 } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất 1 món' });

    // Validate thông tin khách hàng
    if (!customer?.name?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên khách hàng' });
    }
    if (!customer?.phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại' });
    }
    const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
    if (!phoneRegex.test(customer.phone.trim())) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
    }
    if (customer?.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }
    if (orderType === 'delivery' && !customer?.address?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ giao hàng' });
    }

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product?.isAvailable) return res.status(400).json({ success: false, message: `Món ${item.product} không còn phục vụ` });
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product: product._id, name: product.name, price: product.price,
        quantity: item.quantity, image: product.image, options: [], subtotal: itemSubtotal,
      });
    }
    const total = subtotal + deliveryFee;
    const order = await Order.create({
      customer, items: orderItems, subtotal, deliveryFee, total,
      orderType, tableNumber, note, paymentMethod,
      userId: req.user?._id || null,   // gắn user nếu đã đăng nhập
      statusHistory: [{ status: 'pending', note: 'Đơn hàng mới' }],
    });
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } });
    }
    res.status(201).json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// GET /api/orders/my-orders — Lịch sử đơn của khách hàng (đã đăng nhập)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .select('-statusHistory -assignedShipper');

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders — Danh sách đơn (staff)
router.get('/', protect, staffAny, async (req, res) => {
  try {
    const { status, orderType, search, page = 1, limit = 50 } = req.query;
    const role  = req.user.role;
    const query = {};

    if (role === 'shipper') {
      query.status = { $in: ['cooked', 'delivering', 'delivered'] };
      query.orderType = 'delivery';
    } else {
      if (status)    query.status    = status;
      if (orderType) query.orderType = orderType;
      if (search) {
        query.$or = [
          { orderNumber:      { $regex: search, $options: 'i' } },
          { 'customer.name':  { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } },
        ];
      }
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt').skip(skip).limit(Number(limit))
      .populate('assignedShipper', 'name username');
    res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('assignedShipper', 'name username');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders/number/:orderNumber
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate('assignedShipper', 'name username');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/status
router.put('/:id/status', protect, staffAny, async (req, res) => {
  try {
    const { status, note } = req.body;
    const role    = req.user.role;
    const allowed = ROLE_ALLOWED[role] || [];

    if (!allowed.includes(status)) {
      return res.status(403).json({ success: false, message: `Role "${role}" không được đổi sang trạng thái "${status}"` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy, không thể cập nhật' });
    }
    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã hoàn thành, không thể cập nhật' });
    }
    if (!canTransition(order.status, status, order.orderType)) {
      const validNext = getNextAllowed(order.orderType)[order.status] || [];
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${STATUS_LABELS[order.status]}" sang "${STATUS_LABELS[status]}". Bước tiếp theo hợp lệ: ${validNext.map(s => STATUS_LABELS[s]).join(', ') || 'Không có'}.`,
      });
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || `Cập nhật bởi ${req.user.name} (${role})` });
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/assign-shipper
router.put('/:id/assign-shipper', protect, adminOrStaff, async (req, res) => {
  try {
    const { shipperId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (shipperId) {
      const shipper = await User.findOne({ _id: shipperId, role: 'shipper', isActive: true });
      if (!shipper) return res.status(404).json({ success: false, message: 'Không tìm thấy shipper' });
      order.assignedShipper = shipperId;
      order.statusHistory.push({ status: order.status, note: `Gán shipper: ${shipper.name}` });
    } else {
      order.assignedShipper = null;
    }
    await order.save();
    await order.populate('assignedShipper', 'name username');
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// GET /api/orders/stats/summary — Doanh thu tính theo đơn status = completed
router.get('/stats/summary', protect, adminOrStaff, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const notCancelled = { status: { $ne: 'cancelled' } };

    const todayFilter       = { createdAt: { $gte: today } };
    const notCancelledToday = { ...notCancelled, ...todayFilter };

    const [totalOrders, todayOrders, completedRevenue, pendingOrders, completedOrders, topProducts, byType] = await Promise.all([
      Order.countDocuments(notCancelled),
      Order.countDocuments(notCancelledToday),
      // Doanh thu = tổng đơn HOÀN THÀNH trong ngày hôm nay
      Order.aggregate([
        { $match: { status: 'completed', ...todayFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Đang xử lý = chỉ hôm nay
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'cooking', 'cooked'] }, ...todayFilter }),
      // Hoàn thành = chỉ hôm nay
      Order.countDocuments({ status: 'completed', ...todayFilter }),
      // Top 5 món bán chạy hôm nay
      Order.aggregate([
        { $match: notCancelledToday },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Thống kê theo hình thức hôm nay
      Order.aggregate([
        { $match: notCancelledToday },
        { $group: {
          _id: '$orderType',
          count:   { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] } },
        }},
      ]),
    ]);

    const typeStats = { dine_in: { count:0, revenue:0 }, delivery: { count:0, revenue:0 } };
    byType.forEach((t) => { if (typeStats[t._id]) typeStats[t._id] = { count: t.count, revenue: t.revenue }; });

    res.json({ success: true, data: {
      totalOrders,
      todayOrders,
      completedRevenue: completedRevenue[0]?.total || 0,
      pendingOrders,
      completedOrders,
      topProducts,
      typeStats,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

// PUT /api/orders/:id/pickup — Shipper nhận đơn (assign bản thân + chuyển sang delivering)
router.put('/:id/pickup', protect, async (req, res) => {
  try {
    if (req.user.role !== 'shipper') {
      return res.status(403).json({ success: false, message: 'Chỉ Shipper mới có quyền này' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'cooked') {
      return res.status(400).json({ success: false, message: 'Đơn phải ở trạng thái "Đã nấu" mới có thể nhận giao' });
    }
    if (order.orderType !== 'delivery') {
      return res.status(400).json({ success: false, message: 'Chỉ đơn giao hàng mới cần shipper' });
    }

    order.assignedShipper = req.user._id;
    order.status = 'delivering';
    order.statusHistory.push({
      status: 'delivering',
      note: `Shipper ${req.user.name} đã nhận đơn và bắt đầu giao`,
    });
    await order.save();
    await order.populate('assignedShipper', 'name username');
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
