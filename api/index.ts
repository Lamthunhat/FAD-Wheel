/**
 * Điểm đón (Entry Point) của Vercel Serverless Function.
 * Vercel định tuyến tất cả các request có tiền tố /api/* về đây thông qua cấu hình trong vercel.json.
 * 
 * LƯU Ý QUAN TRỌNG: 
 * - Vì package.json sử dụng "type": "module" (ES Modules), bắt buộc phải ghi rõ đuôi .js
 *   khi import các file nội bộ (nhập '../server.js' thay vì '../server').
 */
import app from '../server.js';

export default app;


