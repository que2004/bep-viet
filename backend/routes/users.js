const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly, adminOrStaff } = require('../middleware/auth');

// GET /api/users — Danh sách tất cả tài khoản nội bộ (Admin/Staff)
router.get('/', protect, adminOrStaff, async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};  // include all roles when listing
    if (role) query.role = role;
    else query.role = { $in: ['admin', 'staff', 'shipper', 'customer'] };
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query).select('-password').sort({ role: 1, name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users — Tạo tài khoản nhân viên (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { username, name, password, role, phone } = req.body;

    if (!['staff', 'shipper'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Không thể tạo tài khoản Admin. Chỉ được tạo: Nhân viên / Bếp / Shipper' });
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Username đã tồn tại' });
    }
    const user = await User.create({ username: username.toLowerCase(), name, password, role, phone });
    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id — Sửa tài khoản (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, role, phone, isActive, password } = req.body;

    // Không cho phép đổi role của chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể tự sửa tài khoản của mình' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    if (user.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Không thể sửa tài khoản khách hàng tại đây' });
    }

    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể đặt role Admin cho tài khoản khác' });
    }
    if (name)     user.name     = name;
    if (role)     user.role     = role;
    if (phone)    user.phone    = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password && password.length >= 6) user.password = password;

    await user.save();
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id — Xóa tài khoản (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    if (user.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản khách hàng tại đây' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'Đã xóa tài khoản' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/toggle — Khoá / Mở khoá tài khoản
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể khoá chính mình' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user.toJSON(), message: user.isActive ? 'Đã mở khoá' : 'Đã khoá tài khoản' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
