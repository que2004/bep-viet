const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: { type: String, required: true },
    name:     { type: String, required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, required: true, trim: true, maxlength: 1000 },
    images:   [{ type: String }],
    likes:    { type: Number, default: 0 },
    likedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false }, // đã mua hàng
    orderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    isApproved: { type: Boolean, default: true },  // admin có thể ẩn review
  },
  { timestamps: true }
);

// Mỗi user chỉ review 1 lần mỗi sản phẩm
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Sau khi lưu/xóa → cập nhật rating trung bình của Product
const updateProductRating = async (productId) => {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count':   stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { 'rating.average': 0, 'rating.count': 0 });
  }
};

reviewSchema.post('save', async function () { await updateProductRating(this.product); });
reviewSchema.post('deleteOne', { document: true }, async function () { await updateProductRating(this.product); });
reviewSchema.post('findOneAndDelete', async function (doc) { if (doc) await updateProductRating(doc.product); });

module.exports = mongoose.model('Review', reviewSchema);
// Note: isApproved field added via migration or default true for existing
