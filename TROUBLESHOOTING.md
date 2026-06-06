# Tổng Hợp Lỗi Và Cách Khắc Phục (Troubleshooting & Bug Fixes)

Tài liệu này tổng hợp lại toàn bộ các lỗi gặp phải trong quá trình phát triển, triển khai dự án **LAMBOM WHEEL (FAD-Wheel)** lên Vercel cùng cách khắc phục chi tiết để tham khảo về sau.

---

## 1. Lỗi Kết Nối MongoDB Atlas Tại Local (DNS / Connection Refused)
### 🔴 Triệu chứng
Khi chạy `npm run dev` ở local, terminal báo lỗi đỏ:
```bash
❌ MongoDB connection error: Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0.xxxx.mongodb.net
```

### 🔍 Nguyên nhân
Nhà mạng hoặc DNS mặc định của hệ thống mạng tại Việt Nam chặn các bản ghi SRV (`mongodb+srv://`) khiến Node.js không thể phân giải được địa chỉ IP của MongoDB Atlas cluster.

### 🛠️ Cách khắc phục
*   **Cách 1 (Khuyên dùng):** Thay đổi DNS trên máy tính Windows sang DNS của Google (`8.8.8.8` và `8.8.4.4`) hoặc Cloudflare (`1.1.1.1`).
*   **Cách 2:** Sử dụng VPN hoặc mạng di động 4G để phát mạng cho máy tính khi chạy thử nghiệm local.

---

## 2. Thêm Quán Ăn Nhưng Bị Mất Sau Khi Reload (Data Persistence)
### 🔴 Triệu chứng
Dùng UI thêm quán ăn hoặc viết đánh giá thì hệ thống hiển thị bình thường. Nhưng nhấn F5 (Reload) hoặc khởi động lại server thì toàn bộ dữ liệu mới biến mất.

### 🔍 Nguyên nhân
*   Kết nối MongoDB Atlas bị lỗi (do DNS local hoặc do chưa whitelist IP trên MongoDB Atlas Cloud).
*   Khi kết nối Database thất bại, code backend tự động rơi vào cơ chế dự phòng **Fallback In-Memory** (lưu dữ liệu tạm thời vào RAM của server). Dữ liệu này sẽ mất sạch khi reload / restart app.
*   Chưa cấu hình các biến môi trường `MONGODB_URI` và các API key trên trang cấu hình Vercel.

### 🛠️ Cách khắc phục
1.  **Whitelist IP trên MongoDB Atlas:** Vào Dashboard MongoDB Atlas -> Network Access -> Add IP Address -> Chọn **Allow Access from Anywhere** (`0.0.0.0/0`) vì Vercel sử dụng IP động.
2.  **Cấu hình Environment Variables trên Vercel:** Thêm đầy đủ 3 biến môi trường:
    *   `MONGODB_URI`: Chuỗi kết nối MongoDB Atlas.
    *   `GEMINI_API_KEY`: API Key cho AI gợi ý món ăn.
    *   `SERPAPI_API_KEY`: API Key cho việc tìm kiếm địa điểm.
3.  **Redeploy:** Thực hiện redeploy lại dự án trên Vercel để cập nhật biến môi trường mới.

---

## 3. Lỗi Crash 500 do Reference Error (`path` is not defined)
### 🔴 Triệu chứng
Server chạy local hoặc khi build bị crash ngay lập tức với lỗi:
```bash
ReferenceError: path is not defined
```

### 🔍 Nguyên nhân
Trong quá trình dọn dẹp các thư viện không sử dụng (như logic đọc/ghi file local bằng `fs`), import `path` ở đầu file `server.ts` đã bị xóa nhầm, trong khi hàm `startServer()` ở dưới cùng vẫn gọi `path.join()`.

### 🛠️ Cách khắc phục
Thêm lại dòng import thư viện core của Node.js vào đầu file `server.ts`:
```typescript
import path from "path";
```

---

## 4. Lỗi Serverless Function Crash 500 khi Import Vite Tĩnh
### 🔴 Triệu chứng
Khi gọi bất cứ API nào (`/api/places`, `/api/weather`, ...) trên Vercel, server đều phản hồi lỗi:
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

### 🔍 Nguyên nhân
File `server.ts` import tĩnh Vite ở đầu file (`import { createServer as createViteServer } from "vite"`). Khi deploy lên Vercel, môi trường Serverless không hỗ trợ/không cần thiết chạy Vite compiler làm middleware, dẫn tới crash toàn bộ ứng dụng NodeJS lúc khởi tạo.

### 🛠️ Cách khắc phục
Chuyển Vite import tĩnh thành **Dynamic Import** bên trong khối kiểm tra môi trường:
```typescript
// Xóa import vite ở đầu file, thay thế bằng import động trong startServer():
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  // ...
}
```

---

## 5. Lỗi Node.js ESM Import Resolution trên Vercel (Thiếu đuôi mở rộng `.js`)
### 🔴 Triệu chứng
Sau khi sửa lỗi Vite, gọi API vẫn bị crash 500. Logs của Vercel ghi lại lỗi:
```bash
Cannot find module '/var/task/db/models' imported from /var/task/server.js
Did you mean to import "./db/models.js"?
```

### 🔍 Nguyên nhân
Dự án được cấu hình chạy ở chế độ **ES Modules (ESM)** (`"type": "module"` trong `package.json`). Quy chuẩn ESM của Node.js yêu cầu tất cả các import file local (relative imports) phải có phần mở rộng file đầy đủ (ví dụ `.js`). 
*Lưu ý: Mặc dù file gốc là `.ts`, khi import trong TypeScript chạy chế độ ESM, ta vẫn phải khai báo đuôi là `.js` để sau khi TypeScript compile ra JavaScript, Node.js runtime hiểu được.*

### 🛠️ Cách khắc phục
1.  Sửa import model trong `server.ts` từ:
    ```typescript
    import { Place } from "./db/models";
    ```
    Thành:
    ```typescript
    import { Place } from "./db/models.js";
    ```
2.  Sửa import server trong `api/index.ts` từ:
    ```typescript
    import app from '../server';
    ```
    Thành:
    ```typescript
    import app from '../server.js';
    ```

---

## 💡 Kinh nghiệm rút ra khi làm việc với Vercel Serverless Function & MongoDB
*   **Mở IP Access List:** Luôn luôn đặt IP Access List trên MongoDB Atlas là `0.0.0.0/0` khi kết nối với Vercel.
*   **Debug thông minh khi không có log:** Nếu Serverless bị crash 500 không rõ nguyên nhân, hãy dùng khối `try/catch` bọc hàm `import()` ở file entry (`api/index.ts`) và trả về JSON chứa `err.stack` cho client.
*   **Chú ý quy tắc ESM:** Dự án NodeJS có `"type": "module"` cần tuân thủ nghiêm ngặt việc thêm đuôi `.js` vào tất cả các file local tự định nghĩa khi thực hiện `import`.

---

## 6. Lỗi Nhảy Trang / Cuộn Trang Khi Gửi Hoặc Reset Khung Chat AI
### 🔴 Triệu chứng
Mỗi khi nhấn nút "Làm mới" cuộc hội thoại hoặc nút "Gửi yêu cầu" trong chatbot AI Thư ký Tú béo, toàn bộ trang web bị cuộn nhảy xuống dưới một đoạn bất ngờ.

### 🔍 Nguyên nhân
*   Thẻ `<button>` mặc định trong HTML nếu không khai báo thuộc tính `type="button"` sẽ tự động hành xử như một nút `"submit"`. Nếu đặt trong hoặc gần khối giao diện layout dạng lưới, hành vi này có thể kích hoạt các trigger focus/scroll của trình duyệt.
*   Hiệu ứng `useEffect` tự động cuộn xuống cuối đoạn chat (`chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight`) chạy bất đồng bộ ngay sau khi state thay đổi, xung đột với vị trí cuộn trang hiện tại.

### 🛠️ Cách khắc phục
1.  Bổ sung tường minh thuộc tính `type="button"` cho tất cả các nút điều khiển trong chatbot (gửi tin, làm mới, tag câu hỏi nhanh).
2.  Chặn sự kiện submit mặc định bằng `e.preventDefault()`.
3.  Khi bấm "Làm mới", chủ động đặt cuộn thanh chat về 0 (`scrollTop = 0`) trước khi set lại danh sách tin nhắn để tránh cuộn giật đột ngột.

---

## 7. Lỗi Lọc Địa Điểm Vòng Quay Không Khớp Chi Nhánh Khác
### 🔴 Triệu chứng
Người dùng đã thêm chi nhánh của quán ở "Phường Láng", nhưng khi tích lọc chọn phường "Phường Láng" trên vòng quay, quán đó vẫn không xuất hiện nếu địa chỉ chính của nó khai báo ở phường khác (ví dụ: "Phường Ngọc Hà").

### 🔍 Nguyên nhân
Logic lọc địa điểm ban đầu trên vòng quay chỉ so khớp trường dữ liệu địa chỉ chính `item.location.ward`. Nó bỏ qua mảng các chi nhánh phụ `item.branches`.

### 🛠️ Cách khắc phục
Cập nhật logic `filteredItems` trong vòng quay giống bộ lọc danh sách quán tủ nâng cao: quét toàn bộ mảng `item.branches` nếu có, so khớp địa chỉ chi nhánh chứa chuỗi tên phường được tích lọc. Nếu khớp bất kỳ cơ sở phụ nào, quán đó vẫn được đưa vào vòng quay.

---

## 8. Lỗi Lệch Khung & Xuống Dòng Chữ "Hà Nội" Trong Chatbot
### 🔴 Triệu chứng
Giao diện thanh hiển thị thời tiết nhanh của chatbot AI bị lệch dòng: chữ `🌐 Hà` nằm ở dòng thứ nhất, chữ `Nội:` nằm ở dòng thứ hai làm tổng quan giao diện trông méo mó mất thẩm mỹ.

### 🔍 Nguyên nhân
Do chiều rộng cột chatbot (`lg:col-span-3` khoảng ~250px) khá chật hẹp. Thuộc tính `flex items-center justify-between` của thẻ cha ép hai khối con sang hai bên. Vì không có thuộc tính chống co giãn (`shrink-0 whitespace-nowrap`), trình duyệt tự động tách chữ "Hà Nội:" tại khoảng trắng để xuống dòng cho vừa chiều ngang.

### 🛠️ Cách khắc phục
Đưa phần text thành phố và nhiệt độ vào một khối flex riêng biệt được gắn class `whitespace-nowrap shrink-0`:
```html
<div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
  <span>🌐 Hà Nội:</span>
  <strong className="text-white font-black">{weather.temp}°C</strong>
</div>
```
Và cho phần mô tả thời tiết (`weather.description`) có class `truncate text-right flex-1` để tự động thu gọn bằng dấu ba chấm (`...`) nếu quá dài, tránh xô đẩy cấu trúc hiển thị chính.
