import mongoose from 'mongoose';

// 1. Định nghĩa Schema cho các Chi Nhánh / Cơ Sở Khác của quán ăn
const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }
});

// 2. Định nghĩa Schema cho các Đánh Giá từ phía người dùng
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: String, required: true }
});

// 3. Định nghĩa Schema chính cho Quán Tủ (Địa điểm ăn uống / đồ uống)
const PlaceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID tùy biến (ví dụ: f1, f2, custom_123456) để đồng bộ frontend
  name: { type: String, required: true }, // Tên quán
  type: { type: String, enum: ['food', 'drink'], required: true }, // Loại hình: 'food' (đồ ăn) hoặc 'drink' (đồ uống)
  category: { type: String }, // Danh mục chi tiết (Phở, Bún, Cà phê...)
  location: {
    ward: { type: String, required: true }, // Phường ở Hà Nội
    addressDetail: { type: String }, // Địa chỉ cụ thể (số nhà, ngõ ngách)
    lat: { type: Number }, // Vĩ độ (tọa độ GPS dùng để tính khoảng cách)
    lng: { type: Number }, // Kinh độ
    googleMapsUrl: { type: String } // Link chia sẻ Google Maps (nếu có)
  },
  description: { type: String }, // Mô tả ngắn gọn về đặc trưng quán
  priceRange: { type: String }, // Khoảng giá (không còn hiển thị trên UI, lưu lại làm metadata cho AI nếu cần)
  bestWeather: [{ type: String }], // Các điều kiện thời tiết phù hợp nhất: 'hot' (nóng), 'cold' (lạnh), 'cool' (mát)
  recommendationReason: { type: String }, // Lý do đề xuất (tự động điền nếu quán lấy từ Google Maps/AI gợi ý)
  branches: [BranchSchema], // Danh sách các chi nhánh liên kết
  reviews: [ReviewSchema] // Các đánh giá được tạo
});

/**
 * Xuất Model Place.
 * LƯU Ý: Sử dụng `mongoose.models.Place || ...` để tránh lỗi "OverwriteModelError: Cannot overwrite `Place` model once compiled."
 * Lỗi này rất phổ biến trong môi trường Serverless (như Vercel) hoặc hot-reload của NextJS/Express do model bị compile nhiều lần.
 */
export const Place = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

