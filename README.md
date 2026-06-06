# LAMBOM WHEEL (FAD-Wheel) 🎡🍕🥤

Ứng dụng vòng quay kỳ diệu kết hợp gợi ý ẩm thực Hà Nội theo thời tiết thời gian thực và chatbot tư vấn thông minh (được hỗ trợ bởi Google Gemini AI).

---

## 🌟 Tính Năng Chính
1. **Vòng Quay Kỳ Diệu (Lucky Wheel):** Quay ngẫu nhiên để chọn món ăn/thức uống từ danh sách "quán tủ" của riêng bạn.
2. **Quản Lý Quán Tủ (CRUD):** Thêm, sửa, xóa các địa điểm ăn uống yêu thích trực tiếp trên giao diện.
3. **Đồng Bộ Cloud (MongoDB Atlas):** Lưu trữ dữ liệu vĩnh viễn trên đám mây. Tự động chuyển sang chế độ lưu trữ trong RAM (In-Memory Fallback) nếu kết nối cơ sở dữ liệu gặp sự cố.
4. **Thời Tiết Thực Tế:** Lấy dữ liệu thời tiết Hà Nội thời gian thực (nhiệt độ, độ ẩm, tình trạng mưa gió) thông qua Open-Meteo API.
5. **Gợi Ý AI Theo Thời Tiết:** Trợ lý Gemini AI phân tích thời tiết hiện tại để gợi ý những quán ăn phù hợp nhất từ danh sách của bạn.
6. **Chatbot Trợ Lý Ẩm Thực:** Chat trực tiếp với AI đóng vai "Chuyên gia ẩm thực sành ăn Hà Nội" để được tư vấn ăn gì, ở đâu.
7. **Tìm Kiếm Google Maps:** Tự động tìm kiếm và lấy thông tin địa chỉ từ Google Maps thông qua SerpApi.

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
lambom-wheel/
├── api/
│   └── index.ts          # Điểm đón (Entry point) các API route của Vercel Serverless Function.
├── db/
│   └── models.ts         # Khai báo Schema và Model Mongoose (MongoDB) cho dữ liệu quán ăn.
├── src/                  # Mã nguồn của ứng dụng Frontend (React + Vite)
│   ├── components/       # Các Component UI (LuckyWheel, GoogleMapsSearch,...)
│   ├── App.tsx           # Component chính quản lý giao diện, state và gọi API.
│   ├── data.ts           # Dữ liệu tĩnh dự phòng (các phường ở HN, danh mục preset).
│   ├── types.ts          # Khai báo các TypeScript interfaces cho toàn bộ dự án.
│   └── index.css         # CSS gốc chứa cấu hình theme, phông chữ và hiệu ứng.
├── server.ts             # Backend Express server (định nghĩa các API endpoints và Vite dev-middleware).
├── vercel.json           # File cấu hình định tuyến (Routing) và build cho Vercel.
├── vite.config.ts        # Cấu hình đóng gói frontend của Vite.
├── tsconfig.json         # Cấu hình biên dịch TypeScript.
├── package.json          # Quản lý các dependencies và các câu lệnh run/build.
└── TROUBLESHOOTING.md    # Tài liệu tổng hợp các lỗi lịch sử và cách xử lý.
```

---

## ⚙️ Cơ Chế Hoạt Động Của Hệ Thống (System Architecture)

### 1. Phân Tách Frontend và Backend
*   **Khi Chạy Ở Local (`npm run dev`):** 
    *   File `server.ts` đóng vai trò là một Express server chạy tại cổng `3000`.
    *   Nó sử dụng Vite ở chế độ Middleware (`middlewareMode: true`) để biên dịch và phục vụ trực tiếp mã nguồn Frontend (React) trên cùng một cổng.
    *   Mọi yêu cầu có tiền tố `/api/*` sẽ được Express Router xử lý trực tiếp.
*   **Khi Triển Khai Lên Vercel (Production):**
    *   Vercel sẽ tự động build Frontend của bạn thành các file tĩnh (HTML/JS/CSS) trong thư mục `dist` và serve trực tiếp qua mạng lưới CDN toàn cầu của họ.
    *   Mọi request đến `/api/*` sẽ được định tuyến thông qua cấu hình trong file `vercel.json` để chuyển hướng tới file `api/index.ts`.
    *   Vercel sẽ chạy `api/index.ts` dưới dạng **Serverless Function** (tự động khởi động NodeJS nhỏ gọn để xử lý request rồi tắt đi để tiết kiệm tài nguyên).

### 2. Cơ Chế Lưu Trữ Dữ Liệu (Data Layer)
*   Mỗi khi có yêu cầu lấy, thêm, sửa hoặc xóa quán ăn (`GET`, `POST`, `PUT`, `DELETE` đến `/api/places`):
    1.  Hàm `connectDB()` trong `server.ts` sẽ được gọi để kiểm tra và kết nối tới MongoDB Atlas thông qua biến môi trường `MONGODB_URI`.
    2.  Nếu kết nối **Thành Công**, dữ liệu sẽ được đọc/ghi trực tiếp vào MongoDB Atlas Cloud.
    3.  Nếu kết nối **Thất Bại** (ví dụ: local mất mạng, lỗi DNS, sai chuỗi kết nối): Hệ thống sẽ chuyển sang dùng biến `fallbackPlaces` ở dạng RAM tạm thời. Bạn vẫn có thể thao tác thêm, xóa quán bình thường, nhưng dữ liệu sẽ mất khi restart server.

### 3. Cơ Chế AI gợi ý & Chatbot
*   **Gemini AI gợi ý:** 
    *   Frontend lấy thời tiết thực tế từ Open-Meteo.
    *   Frontend gửi thời tiết này kèm danh sách các quán ăn hiện tại lên `/api/weather/recommend`.
    *   Gemini AI phân tích các món ăn dựa vào thuộc tính `bestWeather` (Nóng/Lạnh/Mát), `category` và `description` để chọn ra danh sách ID các món ăn phù hợp nhất kèm lý do ngắn gọn.
*   **Chatbot trợ lý:**
    *   Sử dụng thư viện chính thức `@google/genai` để trò chuyện trực tiếp với model Gemini.
    *   Khi bạn chat, backend sẽ nạp toàn bộ danh sách quán tủ hiện tại vào Prompt làm dữ liệu ngữ cảnh (Context), giúp AI trả lời chính xác thông tin về địa chỉ, các chi nhánh và các món ăn cụ thể có trong quán tủ của bạn.

---

## 🚀 Hướng Dẫn Chạy Dự Án Tại Local

### Bước 1: Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc của dự án với nội dung:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/fad_wheel
GEMINI_API_KEY=AIzaSy...
SERPAPI_API_KEY=...
```

*Lưu ý về lỗi DNS ở Việt Nam:* Nếu chạy local bị lỗi kết nối MongoDB (`ECONNREFUSED`), hãy đổi DNS của máy tính sang Google DNS (`8.8.8.8`).

### Bước 2: Cài đặt thư viện và chạy
Mở terminal tại thư mục dự án và chạy:
```bash
# Cài đặt các thư viện
npm install

# Khởi chạy dự án ở chế độ phát triển (Development Mode)
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:3000`

---

## 📦 Hướng Dẫn Triển Khai Lên Vercel (Deployment)

1.  Đẩy toàn bộ mã nguồn của bạn lên một repository GitHub công khai hoặc riêng tư.
2.  Truy cập **[Vercel](https://vercel.com/)**, tạo project mới và import repository này.
3.  Trong phần **Settings -> Environment Variables** trên Vercel, thêm 3 biến môi trường tương tự như file `.env`:
    *   `MONGODB_URI`
    *   `GEMINI_API_KEY`
    *   `SERPAPI_API_KEY`
4.  Trên trang quản trị **MongoDB Atlas**, vào mục **Network Access** và chắc chắn rằng đã thêm dòng IP `0.0.0.0/0` (Allow Access from Anywhere) để cho phép các máy chủ của Vercel kết nối vào Database.
5.  Bấm **Deploy** trên Vercel. Vercel sẽ tự động build và cung cấp link trang web hoạt động vĩnh viễn cho bạn.
