/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WheelItem, WeatherInfo } from './types';

// 51 phường mới sắp xếp sáp nhập tại Hà Nội cùng tọa độ trung tâm địa lý
export const WARD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Phường Láng': { lat: 21.0118, lng: 105.8115 },
  'Phường Giảng Võ': { lat: 21.0180, lng: 105.8155 },
  'Phường Ô Chợ Dừa': { lat: 21.0190, lng: 105.8190 },
  'Phường Đống Đa': { lat: 21.0125, lng: 105.8220 },
  'Phường Cầu Giấy': { lat: 21.0255, lng: 105.8035 },
  'Phường Yên Hòa': { lat: 21.0160, lng: 105.7975 },
  'Phường Thanh Xuân': { lat: 20.9995, lng: 105.8085 },
  'Phường Khương Đình': { lat: 20.9920, lng: 105.8130 },
  'Phường Phương Liệt': { lat: 21.0005, lng: 105.8270 },
  'Phường Kim Liên': { lat: 21.0085, lng: 105.8320 },
  'Phường Ngọc Hà': { lat: 21.0360, lng: 105.8220 },
  'Phường Văn Miếu - Quốc Tử Giám': { lat: 21.0250, lng: 105.8360 },
  'Phường Cửa Nam': { lat: 21.0285, lng: 105.8395 },
  'Phường Ba Đình': { lat: 21.0425, lng: 105.8325 },
  'Phường Thanh Liệt': { lat: 20.9780, lng: 105.8050 },
  'Phường Định Công': { lat: 20.9850, lng: 105.8240 },
  'Phường Nghĩa Đô': { lat: 21.0455, lng: 105.7950 },
  'Phường Bạch Mai': { lat: 21.0020, lng: 105.8475 },
  'Phường Hoàn Kiếm': { lat: 21.0285, lng: 105.8520 },
  'Phường Hai Bà Trưng': { lat: 21.0120, lng: 105.8490 },
  'Phường Đại Mỗ': { lat: 20.9950, lng: 105.7780 },
  'Phường Từ Liêm': { lat: 21.0375, lng: 105.7725 },
  'Phường Tây Hồ': { lat: 21.0660, lng: 105.8110 },
  'Phường Xuân Phương': { lat: 21.0280, lng: 105.7480 },
  'Phường Tây Mỗ': { lat: 20.9995, lng: 105.7510 },
  'Phường Xuân Đỉnh': { lat: 21.0650, lng: 105.7890 },
  'Phường Tây Tựu': { lat: 21.0505, lng: 105.7225 },
  'Phường Hà Đông': { lat: 20.9690, lng: 105.7760 },
  'Phường Thượng Cát': { lat: 21.0920, lng: 105.7190 },
  'Phường Đông Ngạc': { lat: 21.0790, lng: 105.7760 },
  'Phường Bồ Đề': { lat: 21.0360, lng: 105.8710 },
  'Phường Hoàng Liệt': { lat: 20.9630, lng: 105.8340 },
  'Phường Vĩnh Tuy': { lat: 20.9980, lng: 105.8750 },
  'Phường Hồng Hà': { lat: 21.0585, lng: 105.8455 },
  'Phường Phú Thượng': { lat: 21.0850, lng: 105.7990 },
  'Phường Long Biên': { lat: 21.0180, lng: 105.8850 },
  'Phường Tương Mai': { lat: 20.9920, lng: 105.8500 },
  'Phường Kiến Hưng': { lat: 20.9495, lng: 105.7875 },
  'Phường Dương Nội': { lat: 20.9805, lng: 105.7410 },
  'Phường Phú Lương': { lat: 20.9350, lng: 105.7750 },
  'Phường Yên Sở': { lat: 20.9710, lng: 105.8610 },
  'Phường Hoàng Mai': { lat: 20.9790, lng: 105.8490 },
  'Phường Vĩnh Hưng': { lat: 20.9925, lng: 105.8810 },
  'Phường Việt Hưng': { lat: 21.0560, lng: 105.9010 },
  'Phường Yên Nghĩa': { lat: 20.9480, lng: 105.7350 },
  'Phường Lĩnh Nam': { lat: 20.9810, lng: 105.8950 },
  'Phường Phúc Lợi': { lat: 21.0370, lng: 105.9280 },
  'Phường Chương Mỹ': { lat: 20.8800, lng: 105.5800 },
  'Phường Sơn Tây': { lat: 21.1380, lng: 105.5015 },
  'Phường Tùng Thiện': { lat: 21.1340, lng: 105.4850 },
  'Phường Phú Diễn': { lat: 21.0450, lng: 105.7680 }
};

// Hàm tính khoảng cách GPS giữa 2 tọa độ (đơn vị km)
export function calculateDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Sắp xếp các phường mới theo thứ tự chữ cái (alphabetical order) Việt Nam
export const HANOI_MERGED_WARDS = Object.keys(WARD_COORDINATES).sort((a, b) => a.localeCompare(b, 'vi'));

export function getItemCoordinates(item: WheelItem): { lat: number; lng: number } {
  if (item.location.lat !== undefined && item.location.lng !== undefined) {
    return { lat: item.location.lat, lng: item.location.lng };
  }
  const wardCoords = WARD_COORDINATES[item.location.ward];
  if (wardCoords) {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = ((hash % 10) - 5) * 0.0008;
    const offsetLng = (((hash >> 2) % 10) - 5) * 0.0008;
    return { lat: wardCoords.lat + offsetLat, lng: wardCoords.lng + offsetLng };
  }
  return { lat: 21.0285, lng: 105.8542 };
}

// Danh sách quán ăn mặc định - để trống, người dùng tự thêm vào
export const INITIAL_FOODS_AND_DRINKS: WheelItem[] = [];

export const MOCK_WEATHER_PROFILES: WeatherInfo[] = [
  {
    city: 'Hà Nội',
    temp: 36,
    condition: 'hot',
    humidity: 80,
    windSpeed: 12,
    description: 'Trời nắng gắt gay gắt, nhiệt độ ngoài trời cao, độ ẩm vừa phải.'
  },
  {
    city: 'Hà Nội',
    temp: 28,
    condition: 'sunny',
    humidity: 65,
    windSpeed: 15,
    description: 'Trời nắng ấm chan hòa, lộng gió, thời tiết cực kỳ lý tưởng để dạo phố.'
  },
  {
    city: 'Hà Nội',
    temp: 16,
    condition: 'cold',
    humidity: 55,
    windSpeed: 20,
    description: 'Gió bấc hanh khô tràn về, trời lạnh buốt tê tái, cần mặc ấm.'
  },
  {
    city: 'Hà Nội',
    temp: 22,
    condition: 'rainy',
    humidity: 95,
    windSpeed: 10,
    description: 'Trời mưa phún sương mờ dầm dề ẩm ướt, nhiệt độ se lạnh sương mù.'
  },
  {
    city: 'Hà Nội',
    temp: 24,
    condition: 'cool',
    humidity: 70,
    windSpeed: 14,
    description: 'Không khí thu Hà Nội mát mẻ hiu hiu, dễ chịu vô cùng.'
  },
  {
    city: 'Hà Nội',
    temp: 20,
    condition: 'windy',
    humidity: 60,
    windSpeed: 25,
    description: 'Trời nhiều mây lộng gió, gió cuốn nhẹ xào xạc lá rơi.'
  },
  {
    city: 'Hà Nội',
    temp: 34,
    condition: 'humid',
    humidity: 90,
    windSpeed: 8,
    description: 'Trời oi bức nóng hầm hập nồm ẩm, nhiều mây ẩm thấp khó chịu.'
  }
];

export function getWeatherConditionLabel(condition: WeatherInfo['condition']): string {
  switch (condition) {
    case 'hot': return 'Nắng gắt, Oi bức';
    case 'sunny': return 'Nắng ráo, Ấm áp';
    case 'cold': return 'Lạnh giá, Gió bấc';
    case 'rainy': return 'Mưa phùn, Ẩm sương';
    case 'cool': return 'Mát mẻ, Mùa thu';
    case 'windy': return 'Lộng gió, Gió lớn';
    case 'humid': return 'Nồm ẩm, Ngột ngạt';
    default: return 'Bình thường';
  }
}

// Hàm hỗ trợ tạo link tìm kiếm Google Maps năng động cho từng địa điểm
export function getGoogleMapsSearchUrl(name: string, addressDetail?: string, ward?: string): string {
  const parts = [
    name,
    addressDetail,
    ward,
    'Hà Nội'
  ].filter(Boolean);
  const query = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
