const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image:    { type: String, default: '' },
  options:  [{ name: String, choice: String, price: Number }],
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer: {
      name:    { type: String, required: [true, 'Customer name is required'] },
      phone:   { type: String, required: [true, 'Phone number is required'] },
      email:   { type: String, default: '' },
      address: { type: String, default: '' },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items:       [orderItemSchema],
    subtotal:    { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount:    { type: Number, default: 0 },
    total:       { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'momo'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    // MoMo specific fields
    momo: {
      appTransId:  { type: String, default: '' }, // mã giao dịch gửi sang MoMo
      zpTransToken:{ type: String, default: '' }, // token để tạo payment URL
      orderUrl:    { type: String, default: '' }, // deeplink MoMo
      qrCode:      { type: String, default: '' }, // QR động từ MoMo
      zpTransId:   { type: String, default: '' }, // mã giao dịch thực từ MoMo (callback)
      returnCode:  { type: Number, default: null },
      paidAt:      { type: Date, default: null },
    },

    orderType:       { type: String, enum: ['dine_in', 'delivery'], default: 'dine_in' },
    status: {
      type: String,
      enum: ['pending','confirmed','cooking','cooked','delivering','delivered','completed','cancelled'],
      default: 'pending',
    },
    assignedShipper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    tableNumber:     { type: String, default: '' },
    note:            { type: String, default: '' },
    estimatedTime:   { type: Number, default: 20 },
    statusHistory: [{
      status:    String,
      timestamp: { type: Date, default: Date.now },
      note:      String,
    }],
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
