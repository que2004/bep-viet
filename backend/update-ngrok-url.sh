#!/bin/bash
# Lấy URL ngrok hiện tại và tự động cập nhật vào .env

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
  | grep -o '"public_url":"https://[^"]*"' \
  | head -1 \
  | sed 's/"public_url":"//;s/"//')

if [ -z "$NGROK_URL" ]; then
  echo "❌ Không tìm thấy ngrok. Hãy chạy 'ngrok http 5000' trước."
  exit 1
fi

# Cập nhật BACKEND_URL trong .env
if grep -q "BACKEND_URL" .env; then
  sed -i.bak "s|BACKEND_URL=.*|BACKEND_URL=$NGROK_URL|" .env
else
  echo "BACKEND_URL=$NGROK_URL" >> .env
fi

echo "✅ Đã cập nhật BACKEND_URL=$NGROK_URL"
echo "👉 Hãy restart backend: npm run dev"
