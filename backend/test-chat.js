require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key loaded:', apiKey ? `${apiKey.slice(0, 8)}...` : 'MISSING');

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEY chưa được set trong .env');
    return;
  }

  try {
    console.log('Testing gemini-2.0-flash...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage('Xin chào, trả lời ngắn thôi nhé');
    console.log('✅ Thành công! Gemini trả lời:', result.response.text().slice(0, 100));
  } catch (e) {
    console.error('❌ Lỗi gemini-2.0-flash:', e.message);
    
    // Thử model cũ hơn
    try {
      console.log('\nThử gemini-1.5-flash...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage('Xin chào, trả lời ngắn thôi nhé');
      console.log('✅ gemini-1.5-flash OK:', result.response.text().slice(0, 100));
      console.log('\n⚠️  Hãy đổi model trong chat.js thành gemini-1.5-flash');
    } catch (e2) {
      console.error('❌ Lỗi gemini-1.5-flash:', e2.message);
      console.log('\n💡 Nguyên nhân có thể:');
      console.log('   - API key sai hoặc chưa kích hoạt');
      console.log('   - Tài khoản Google chưa enable Gemini API');
      console.log('   - IP bị chặn (thử dùng VPN)');
    }
  }
}

test();
