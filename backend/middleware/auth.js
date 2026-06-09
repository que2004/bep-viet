const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Xác thực JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// Chỉ Admin (toàn quyền kể cả quản lý tài khoản)
exports.adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền này' });
};

// Admin HOẶC Nhân viên (staff) — dùng cho hầu hết tác vụ quản lý
exports.adminOrStaff = (req, res, next) => {
  if (['admin', 'staff'].includes(req.user?.role)) return next();
  res.status(403).json({ success: false, message: 'Cần quyền Admin hoặc Nhân viên' });
};

// Bất kỳ tài khoản nội bộ (admin, staff, kitchen, shipper)
exports.staffAny = (req, res, next) => {
  if (['admin', 'staff', 'shipper'].includes(req.user?.role)) return next();
  res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
};

// Alias
exports.superAdmin = exports.adminOnly;
