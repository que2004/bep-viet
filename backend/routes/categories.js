const express  = require('express');
const router   = express.Router();
const Category = require('../models/Category');
const { protect, adminOrStaff } = require('../middleware/auth');

// Tự tạo slug từ tên tiếng Việt
const toSlug = (str) =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // bỏ dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories
router.post('/', protect, adminOrStaff, async (req, res) => {
  try {
    const { name, icon, description, order } = req.body;
    // Tự sinh slug, đảm bảo unique bằng cách thêm timestamp nếu trùng
    let slug = toSlug(name);
    const exists = await Category.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now()}`;

    const category = await Category.create({ name, slug, icon, description, order });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/reorder — phải đặt TRƯỚC /:id để không bị bắt nhầm
router.put('/reorder', protect, adminOrStaff, async (req, res) => {
  try {
    const { orders } = req.body; // [{ id, order }]
    await Promise.all(orders.map(({ id, order }) => Category.findByIdAndUpdate(id, { order })));
    res.json({ success: true, message: 'Đã cập nhật thứ tự' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', protect, adminOrStaff, async (req, res) => {
  try {
    const updates = { ...req.body };
    // Nếu đổi tên thì cập nhật slug luôn
    if (updates.name) {
      updates.slug = toSlug(updates.name);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', protect, adminOrStaff, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
