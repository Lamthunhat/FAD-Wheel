/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemType = 'food' | 'drink';

export interface LocationInfo {
  ward: string;       // Phường mới sát nhập (e.g., Liên phường Hàng Bạc - Hàng Bồ)
  district?: string;   // Không bắt buộc nữa (Sát nhập bỏ cấp quận)
  addressDetail?: string; // Tên đường, sổ ngõ chi tiết
  googleMapsUrl?: string; // Link bản đồ Google Maps tùy chỉnh nếu cần thiết
  lat?: number;        // Kinh độ tùy chọn
  lng?: number;        // Vĩ độ tùy chọn
}

export interface Review {
  id: string;
  rating: number; // e.g., 1 to 5 stars
  comment: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface WheelItem {
  id: string;
  name: string;
  type: ItemType;
  location: LocationInfo;
  description?: string;
  priceRange: string;  // e.g. 30k - 50k, 100k - 200k
  bestWeather: string[]; // e.g. ['hot', 'cold', 'cool']
  recommendationReason?: string; // Lý do xuất hiện
  openTime?: string;   // Giờ mở cửa, vd '08:00'
  closeTime?: string;  // Giờ đóng cửa, vd '22:00'
  reviews?: Review[];
  branches?: Branch[];
  category?: string;   // Danh mục món (e.g. bún, cơm, món cuốn, cà phê, trà...)
  calculatedDistance?: number; // Khoảng cách GPS tính toán động
}

export interface WeatherInfo {
  temp: number;
  condition: 'sunny' | 'rainy' | 'cold' | 'hot' | 'windy' | 'humid' | 'cool';
  humidity: number;
  windSpeed: number;
  description: string;
  city: string;
}

export interface AIRecommendation {
  suggestedItems: string[]; // List of IDs
  weatherAnalysis: string;   // Narrative markdown
  vibeText: string;          // Catchy Vietnamese phrase for the day
}
