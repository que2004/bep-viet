const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, name, password, phone } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ username, họ tên và mật khẩu',
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Username đã được sử dụng, vui lòng chọn username khác',
      });
    }

    const user = await User.create({
      username: username.toLowerCase(),
      name,
      password,
      phone,
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập username và mật khẩu',
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Username hoặc mật khẩu không đúng',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị',
      });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username: username.toLowerCase(),
      role: { $in: ['admin', 'staff', 'shipper'] },
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Username hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/auth/check-username/:username - Kiểm tra username có sẵn không
router.get('/check-username/:username', async (req, res) => {
  try {
    const exists = await User.findOne({ username: req.params.username.toLowerCase() });
    res.json({ success: true, available: !exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
