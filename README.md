# 🍜 Bếp Việt – Restaurant Web App

Full-stack ứng dụng đặt đồ ăn online cho nhà hàng Việt Nam.

**Stack:** React.js · Node.js · Express · MongoDB · Axios · MoMo Payment

---

## 📁 Cấu trúc dự án

```
restaurant-app/
├── backend/                   # Node.js + Express API
│   ├── models/
│   │   ├── Category.js        # Model danh mục
│   │   ├── Product.js         # Model món ăn
│   │   ├── Order.js           # Model đơn hàng
│   │   └── User.js            # Model người dùng
│   ├── routes/
│   │   ├── auth.js            # Đăng ký / Đăng nhập
│   │   ├── categories.js      # CRUD danh mục
│   │   ├── products.js        # CRUD món ăn
│   │   ├── orders.js          # CRUD đơn hàng
│   │   ├── cart.js            # Xác thực giỏ hàng
│   │   ├── chat.js            # AI chat (Gemini)
│   │   └── momo.js            # Thanh toán MoMo
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── server.js              # Entry point
│   ├── seed.js                # Dữ liệu mẫu
│   └── .env.example
│
└── frontend/                  # React.js
    └── src/
        ├── api/index.js       # Axios config + API calls
        ├── context/
        │   ├── CartContext.jsx # Giỏ hàng (localStorage)
        │   └── AuthContext.jsx # Xác thực người dùng
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── ProductCard.jsx
        │   ├── ReviewSection.jsx
        │   ├── ChatWidget.jsx  # AI chat widget
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── HomePage.jsx         # Trang chủ + Hero
            ├── MenuPage.jsx         # Thực đơn + lọc
            ├── ProductDetailPage.jsx
            ├── CartPage.jsx
            ├── CheckoutPage.jsx     # Đặt hàng + chọn thanh toán
            ├── OrderTrackingPage.jsx
            ├── OrderHistoryPage.jsx
            ├── AdminLoginPage.jsx
            └── AdminPage.jsx        # Dashboard quản trị
```

---

## 🚀 Hướng dẫn cài đặt

### 1. Yêu cầu
- **Node.js** >= 18
- **MongoDB** (local hoặc MongoDB Atlas)
- **npm** hoặc **yarn**
- **ngrok** (chỉ cần khi test thanh toán MoMo ở local)

---

### 2. Backend

```bash
cd backend
npm install

# Tạo file .env từ mẫu
cp .env.example .env
# Điền các biến môi trường (xem phần ⚙️ bên dưới)

# Chạy seed dữ liệu mẫu
npm run seed

# Khởi động server
npm run dev         # Development (nodemon)
npm start           # Production
```

Server chạy tại: `http://localhost:5000`

---

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App chạy tại: `http://localhost:3000`

---

## 💳 Tích hợp thanh toán MoMo

Dự án sử dụng **MoMo Sandbox** để xử lý thanh toán online.

### Luồng hoạt động

```
Người dùng chọn thanh toán MoMo
        ↓
Frontend gọi POST /api/momo/create
        ↓
Backend tạo giao dịch → gửi lên MoMo Sandbox
        ↓
MoMo trả về QR Code / deeplink
        ↓
Người dùng quét QR hoặc mở app MoMo
        ↓
MoMo callback về POST /api/momo/callback (cần URL public)
        ↓
Backend cập nhật trạng thái đơn hàng → paid
        ↓
Frontend polling POST /api/momo/check để hiển thị kết quả
```

### API Endpoints MoMo

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/momo/create` | Tạo giao dịch, nhận QR + deeplink |
| POST | `/api/momo/callback` | MoMo gọi về sau thanh toán (IPN) |
| POST | `/api/momo/check` | Frontend polling kiểm tra trạng thái |

### Cấu hình MoMo Sandbox

1. Đăng ký tài khoản tại [developers.momo.vn](https://developers.momo.vn)
2. Lấy `partnerCode`, `accessKey`, `secretKey` từ Sandbox dashboard
3. Điền vào `.env` (xem phần ⚙️ bên dưới)

### Test thanh toán ở Local (cần ngrok)

MoMo cần gọi callback về một URL **public**. Khi dev local, dùng ngrok. Chạy theo đúng thứ tự sau:

**Bước 1** — Cài ngrok và thêm authtoken:
```bash
# Tải tại https://ngrok.com/download, sau đó:
ngrok config add-authtoken <TOKEN_CUA_BAN>
```

**Bước 2** — Mở 4 terminal, chạy theo thứ tự:

```bash
# Terminal 1 — Chạy backend
cd backend && npm run dev

# Terminal 2 — Expose port 5000 ra internet
ngrok http 5000
# Copy URL dạng: https://XXXX.ngrok-free.app

# Terminal 3 — Cập nhật .env rồi restart backend
# Sửa BACKEND_URL=https://XXXX.ngrok-free.app trong backend/.env
# Sau đó Ctrl+C Terminal 1 và npm run dev lại

# Terminal 4 — Chạy frontend
cd frontend && npm start
```

**Bước 3** — Test thanh toán:
1. Vào `http://localhost:3000`, thêm món vào giỏ
2. Thanh toán → chọn **MoMo** → bấm **"💜 Thanh toán qua MoMo"**
3. Dùng app MoMo quét QR với tài khoản sandbox:

```
SĐT:      0000000000
Mật khẩu: 000000
OTP:      000000
```

> Xem thêm tại: https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions

**Lưu ý quan trọng:**

| Tình huống | Xử lý |
|-----------|-------|
| URL ngrok thay đổi sau khi restart | Cập nhật lại `BACKEND_URL` trong `.env` và restart backend |
| Ngrok báo "session expired" (free tier ~2 giờ) | Restart ngrok, cập nhật URL lại |
| Modal QR không tự cập nhật sau thanh toán | Kiểm tra ngrok có đang chạy không |
| Lỗi "MoMo từ chối giao dịch" | Kiểm tra `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` trong `.env` |
| Lỗi signature không khớp | Đảm bảo `MOMO_PARTNER_CODE` đúng với key đang dùng |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/admin-login` | Đăng nhập admin |
| GET | `/api/auth/me` | Thông tin user hiện tại |

### Categories
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/categories` | Lấy tất cả danh mục |
| POST | `/api/categories` | Tạo danh mục (Admin) |
| PUT | `/api/categories/:id` | Cập nhật (Admin) |
| DELETE | `/api/categories/:id` | Xóa (Admin) |

### Products
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách món ăn (filter/sort/paging) |
| GET | `/api/products/featured` | Món nổi bật |
| GET | `/api/products/:id` | Chi tiết món ăn |
| POST | `/api/products` | Thêm món (Admin) |
| PUT | `/api/products/:id` | Sửa món (Admin) |
| DELETE | `/api/products/:id` | Xóa món (Admin) |

### Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders` | Tất cả đơn (Admin) |
| GET | `/api/orders/:id` | Chi tiết đơn |
| GET | `/api/orders/number/:num` | Tìm theo mã đơn |
| PUT | `/api/orders/:id/status` | Cập nhật trạng thái (Admin) |
| GET | `/api/orders/stats/summary` | Thống kê (Admin) |

### MoMo Payment
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/momo/create` | Tạo giao dịch MoMo |
| POST | `/api/momo/callback` | Callback từ MoMo (IPN) |
| POST | `/api/momo/check` | Kiểm tra trạng thái giao dịch |

### Chat AI
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/chat` | Gửi tin nhắn đến AI (Gemini) |

---

## 🎨 Tính năng

### Khách hàng
- 🏠 Trang chủ với hero animation, món nổi bật
- 🍽️ Thực đơn với lọc theo danh mục, tìm kiếm, sắp xếp
- 🔍 Xem chi tiết từng món ăn
- 🛒 Giỏ hàng (lưu localStorage, real-time)
- 📋 Đặt hàng: ăn tại bàn / mang về / giao hàng
- 💳 Thanh toán tiền mặt hoặc **MoMo** (QR / deeplink)
- 📦 Theo dõi trạng thái đơn hàng real-time
- 🤖 Chat AI hỗ trợ tư vấn món ăn (Gemini)
- ⭐ Đánh giá & nhận xét món ăn

### Quản trị (`/admin`)
- 📊 Dashboard: thống kê doanh thu, đơn hàng
- 📋 Quản lý đơn hàng + cập nhật trạng thái
- 🍜 CRUD món ăn đầy đủ
- 🔐 Xác thực JWT

---

## 🔑 Tài khoản demo

```
Admin: admin@restaurant.com / admin123
```

---

## ⚙️ Biến môi trường (Backend .env)
Tạo file .env dựa trên file .env.example
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/restaurant_db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

# URL
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://xxxx.ngrok-free.app   # URL public khi test local với ngrok

# MoMo Sandbox
# Lấy tại: https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_QUERY_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/query

# Gemini AI (tùy chọn — cho chat widget)
GEMINI_API_KEY=your_gemini_api_key
```

> 🔒 **Lưu ý bảo mật:** Không commit file `.env` lên Git. Khi deploy production, thay toàn bộ thông tin Sandbox bằng thông tin Production từ MoMo.

### Biến môi trường khi deploy Production

```env
BACKEND_URL=https://ten-app.onrender.com
FRONTEND_URL=https://ten-app.vercel.app
MOMO_PARTNER_CODE=<production_partner_code>
MOMO_ACCESS_KEY=<production_access_key>
MOMO_SECRET_KEY=<production_secret_key>
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
MOMO_QUERY_ENDPOINT=https://payment.momo.vn/v2/gateway/api/query
```

---

## 🛠️ Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, React Hot Toast |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Thanh toán | MoMo Payment Gateway (Sandbox) |
| AI Chat | Google Gemini API |
| Styling | CSS thuần (không dùng framework UI) |
| Font | Playfair Display + Be Vietnam Pro |
| Dev Tools | ngrok (test MoMo callback local) |
