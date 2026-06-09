const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect, adminOnly, adminOrStaff } = require('../middleware/auth');

// GET /api/reviews/:productId — Lấy tất cả đánh giá của 1 sản phẩm
router.get('/:productId', async (req, res) => {
  try {
    const { sort = '-createdAt', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ product: req.params.productId });
    const reviews = await Review.find({ product: req.params.productId })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-likedBy');

    // Thống kê rating
    const stats = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach((s) => { distribution[s._id] = s.count; });

    res.json({ success: true, data: reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, distribution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews/:productId — Gửi đánh giá (đã đăng nhập)
router.post('/:productId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đánh giá và bình luận' });
    }

    // Kiểm tra đã review chưa
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá món ăn này rồi' });
    }

    const review = await Review.create({
      product:  req.params.productId,
      user:     req.user._id,
      username: req.user.username,
      name:     req.user.name,
      rating:   Number(rating),
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá món ăn này rồi' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reviews/:reviewId — Sửa đánh giá (chủ sở hữu)
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đánh giá này' });
    }
    const { rating, comment } = req.body;
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:reviewId — Xóa (chủ sở hữu hoặc Admin)
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'staff'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa đánh giá này' });
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews/:reviewId/like — Thích đánh giá
router.post('/:reviewId/like', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    const userId = req.user._id;
    const alreadyLiked = review.likedBy.some((id) => id.toString() === userId.toString());
    if (alreadyLiked) {
      review.likedBy = review.likedBy.filter((id) => id.toString() !== userId.toString());
      review.likes = Math.max(0, review.likes - 1);
    } else {
      review.likedBy.push(userId);
      review.likes += 1;
    }
    await review.save();
    res.json({ success: true, likes: review.likes, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// GET /api/reviews/admin/all — Tất cả reviews (Admin)
router.get('/admin/all', protect, adminOrStaff, async (req, res) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;
    const query = {};
    if (approved === 'true')  query.isApproved = true;
    if (approved === 'false') query.isApproved = false;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort('-createdAt').skip(skip).limit(Number(limit))
      .populate('product', 'name image');
    res.json({ success: true, data: reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/reviews/:reviewId/approve — Duyệt / Ẩn review
router.patch('/:reviewId/approve', protect, adminOrStaff, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { isApproved: req.body.isApproved },
      { new: true }
    ).populate('product', 'name');
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy review' });
    res.json({ success: true, data: review });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
