const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Cache menu để không fetch DB mỗi request (reset sau 5 phút)
let menuCache = null;
let menuCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getMenuContext() {
  if (menuCache && Date.now() - menuCacheTime < CACHE_TTL) return menuCache;

  const [products, categories] = await Promise.all([
    Product.find({ isAvailable: true })
      .populate('category', 'name')
      .select('name price category isFeatured preparationTime')
      .limit(40),
    Category.find().select('name icon'),
  ]);

  const menuText = products
    .map((p) => {
      let line = `• ${p.name} (${p.category?.name || 'Khác'}): ${p.price.toLocaleString('vi-VN')}đ`;
      if (p.preparationTime) line += ` ~${p.preparationTime}ph`;
      if (p.isFeatured) line += ' ⭐';
      return line;
    })
    .join('\n');

  const categoriesText = categories.map((c) => `${c.icon || ''} ${c.name}`.trim()).join(', ');

  menuCache = { menuText, categoriesText };
  menuCacheTime = Date.now();
  return menuCache;
}

// POST /api/chat
router.post('/', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      success: false,
      message: '⚠️ Chatbot chưa được cấu hình. Liên hệ quản trị viên.',
    });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages là bắt buộc' });
    }

    const { menuText, categoriesText } = await getMenuContext();

    const systemPrompt = `Bạn là trợ lý AI của nhà hàng Bếp Việt, chuyên ẩm thực Việt Nam.
Trả lời bằng tiếng Việt, thân thiện, tối đa 3 câu, dùng emoji.
Chỉ tư vấn về món ăn, giá, đặt hàng. Hướng dẫn vào /menu hoặc /cart khi cần.

Danh mục: ${categoriesText}
Thực đơn (⭐=nổi bật):
${menuText}`;

    const lastMessage = messages[messages.length - 1];
    const historyMessages = messages.slice(0, -1);

    // Build history hợp lệ cho Gemini (xen kẽ user/model, bắt đầu = user)
    const history = [];
    for (const m of historyMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (history.length > 0 && history[history.length - 1].role === role) continue;
      history.push({ role, parts: [{ text: m.content || '' }] });
    }
    if (history.length > 0 && history[0].role !== 'user') history.shift();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content || '');
    const text = result.response.text();

    res.json({ success: true, message: text });
  } catch (error) {
    const msg = error?.message || '';
    console.error('Chat error:', msg);

    // Trả về lỗi rõ ràng hơn cho client
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      return res.status(429).json({
        success: false,
        message: '⏳ Chatbot đang bận, vui lòng thử lại sau vài giây.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Trợ lý AI tạm thời không khả dụng, vui lòng thử lại.',
    });
  }
});

module.exports = router;
