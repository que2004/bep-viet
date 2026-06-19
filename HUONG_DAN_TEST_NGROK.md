# 🧪 Hướng dẫn test MoMo với ngrok

## Bước 1 — Cài ngrok

Tải tại: https://ngrok.com/download

Sau khi cài xong, đăng ký tài khoản miễn phí tại https://dashboard.ngrok.com/signup
rồi chạy lệnh này (thay bằng token thật của bạn):

```bash
ngrok config add-authtoken <TOKEN_CUA_BAN>
```

---

## Bước 2 — Cài dependencies

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

---

## Bước 3 — Chạy theo đúng thứ tự

### Terminal 1: Chạy backend
```bash
cd backend
npm run dev
```
Thấy `Server running on port 5000` là OK.

### Terminal 2: Chạy ngrok
```bash
ngrok http 5000
```
Sẽ thấy dòng:
```
Forwarding  https://XXXX.ngrok-free.app -> http://localhost:5000
```
**Copy URL https đó lại.**

### Terminal 3: Cập nhật BACKEND_URL rồi restart backend
Mở file `backend/.env`, sửa dòng:
```
BACKEND_URL=https://XXXX.ngrok-free.app
```
Quay lại Terminal 1, bấm Ctrl+C rồi chạy lại:
```bash
npm run dev
```

### Terminal 4: Chạy frontend
```bash
cd frontend
npm start
```
Trình duyệt tự mở tại http://localhost:3000

---

## Bước 4 — Test thanh toán MoMo

1. Vào http://localhost:3000
2. Thêm món vào giỏ hàng
3. Vào trang Thanh toán → chọn **MoMo**
4. Điền thông tin → bấm **"💜 Thanh toán qua MoMo"**
5. Modal QR hiện ra

### Để quét QR thanh toán (Sandbox):
- Tải app **MoMo** trên điện thoại
- Đăng nhập bằng tài khoản sandbox:
  - SĐT: `0000000000`
  - Mật khẩu: `000000`
  - OTP: `000000`
- Vào **Quét mã** → quét QR trong modal

Sau khi thanh toán, modal tự động chuyển sang ✅ và redirect về trang theo dõi đơn.

> Xem thêm tài khoản test tại: https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions

---

## ⚠️ Lưu ý

| Tình huống | Xử lý |
|-----------|-------|
| URL ngrok thay đổi sau khi restart | Cập nhật lại `BACKEND_URL` trong `.env` và restart backend |
| Ngrok báo "session expired" (free tier ~2 giờ) | Restart ngrok, cập nhật URL lại |
| Modal QR hiện nhưng không tự cập nhật sau thanh toán | Kiểm tra ngrok có đang chạy không |
| Lỗi "MoMo từ chối giao dịch" | Kiểm tra `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` trong `.env` |
| Lỗi signature không khớp | Đảm bảo `MOMO_PARTNER_CODE` đúng với key đang dùng |

---

## Khi deploy lên production

Chỉ cần thay các biến sau trong Environment Variables trên server:

```
BACKEND_URL=https://ten-app.onrender.com     ← URL server thật
FRONTEND_URL=https://ten-app.vercel.app      ← URL frontend thật
MOMO_PARTNER_CODE=<production_partner_code>  ← Lấy từ MoMo Business Portal
MOMO_ACCESS_KEY=<production_access_key>
MOMO_SECRET_KEY=<production_secret_key>
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create        ← Production (bỏ "test-")
MOMO_QUERY_ENDPOINT=https://payment.momo.vn/v2/gateway/api/query
```

**Không cần sửa bất kỳ dòng code nào.**
