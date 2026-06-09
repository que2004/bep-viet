const express = require('express');
const router = express.Router();

// Cart is managed on the frontend (localStorage)
// This route is just a placeholder for server-side cart validation

// POST /api/cart/validate
router.post('/validate', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { items } = req.body;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('category', 'name');
      if (product && product.isAvailable) {
        validatedItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: item.quantity,
          isAvailable: true,
        });
      } else {
        validatedItems.push({
          product: item.productId,
          isAvailable: false,
          message: 'Product is no longer available',
        });
      }
    }

    res.json({ success: true, data: validatedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
