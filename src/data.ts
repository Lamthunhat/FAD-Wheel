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
  const R = 6371; // Bán kính Trái đất
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const langCoords = WARD_COORDINATES['Phường Láng'];

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

export const INITIAL_FOODS_AND_DRINKS: WheelItem[] = [
  // FOODS
  {
    id: 'f1',
    name: 'Phở Bò Lý Quốc Sư',
    type: 'food',
    category: 'Phở',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: '10 Lý Quốc Sư',
      lat: 21.0298,
      lng: 105.8490
    },
    description: 'Thương hiệu phở truyền thống trứ danh với nước dùng ninh xương bò ngọt thanh, thơm mùi hồi quế thảo quả.',
    priceRange: '60.000đ - 90.000đ',
    bestWeather: ['cold', 'rainy', 'cool', 'windy'],
    recommendationReason: 'Trời se lạnh hay lất phất mưa mà xì xụp bát phở bò nóng hổi thơm phức thì không gì bằng.',
    branches: [
      { id: 'br_f1_1', name: 'Trụ sở chính: Lý Quốc Sư', address: '10 Lý Quốc Sư, Hoàn Kiếm, Hà Nội' },
      { id: 'br_f1_2', name: 'Cơ sở Mỹ Đình', address: 'N01 Tòa nhà Landmark, Mỹ Đình, Nam Từ Liêm, Hà Nội' },
      { id: 'br_f1_3', name: 'Cơ sở Tây Hồ', address: '42 Võ Chí Công, Tây Hồ, Hà Nội' }
    ]
  },
  {
    id: 'f2',
    name: 'Bún Chả Hương Liên',
    type: 'food',
    category: 'Bún',
    location: {
      ward: 'Phường Hai Bà Trưng',
      addressDetail: '24 Lê Văn Hưu',
      lat: 21.0195,
      lng: 105.8548
    },
    description: 'Nổi tiếng là nơi cựu Tổng thống Obama dùng bữa, bún chả thơm nức mũi vị nướng than hoa sả tỏi.',
    priceRange: '50.000đ - 80.000đ',
    bestWeather: ['sunny', 'hot', 'warm', 'cool'],
    recommendationReason: 'Hương vị bún chả chua ngọt thanh mát cực thích hợp cho những ngày nắng đẹp ấm áp.',
    branches: [
      { id: 'br_f2_1', name: 'Cơ sở Lê Văn Hưu', address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội' },
      { id: 'br_f2_2', name: 'Cơ sở Láng Hạ', address: '14 ngõ 59 Láng Hạ, Đống Đa, Hà Nội' }
    ]
  },
  {
    id: 'f3',
    name: 'Bún Đậu Mắm Tôm Hàng Khay',
    type: 'food',
    category: 'Bún',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: 'Ngõ 31 Hàng Khay',
      lat: 21.0264,
      lng: 105.8528
    },
    description: 'Bún đậu mẹt đầy đặn với đậu rán giòn tan, thịt chân giò, chả cốm dẻo thơm rưới mắm tôm đánh sủi bọt cốt quất.',
    priceRange: '45.000đ - 70.000đ',
    bestWeather: ['cool', 'sunny', 'warm', 'humid'],
    recommendationReason: 'Món ăn quốc dân hợp khẩu vị cho mọi kiểu thời tiết, đặc biệt là những ngày mát trời tụ tập bạn bè.'
  },
  {
    id: 'f4',
    name: 'Lẩu Riêu Cua Sườn Sụn',
    type: 'food',
    category: 'Lẩu',
    location: {
      ward: 'Phường Ba Đình',
      addressDetail: '66 Phó Đức Chính',
      lat: 21.0440,
      lng: 105.8425
    },
    description: 'Nước lẩu cua đồng thanh mát ngập tràn gạch cua, nhúng kèm sườn sụn sần sật, giò tai dầy dặn và rau sống.',
    priceRange: '150.000đ - 250.000đ/người',
    bestWeather: ['cold', 'rainy', 'windy'],
    recommendationReason: 'Một nồi lẩu riêu ấm áp bốc khói rực rỡ là đỉnh cao lựa chọn khi trời mưa dầm hoặc gió bấc đổ bộ.'
  },
  {
    id: 'f5',
    name: 'Phở Cuốn Ngũ Xã',
    type: 'food',
    category: 'Món cuốn',
    location: {
      ward: 'Phường Ba Đình',
      addressDetail: 'Hồ Trúc Bạch, Ngũ Xã',
      lat: 21.0455,
      lng: 105.8385
    },
    description: 'Bánh phở mỏng dai cuốn thịt bò xào lăn đậm vị kèm rau thơm, chấm nước mắm chua ngọt cực thanh nhẹ.',
    priceRange: '40.000đ - 70.000đ',
    bestWeather: ['hot', 'sunny', 'warm'],
    recommendationReason: 'Món ăn thanh mát, không dầu mỡ nặng nề, hoàn hảo để thưởng thức bên hồ Trúc Bạch lộng gió ngày nắng nóng.'
  },
  {
    id: 'f6',
    name: 'Bánh Đúc Nóng Trung Tự',
    type: 'food',
    category: 'Đồ ăn vặt',
    location: {
      ward: 'Phường Kim Liên',
      addressDetail: 'Sân tập thể C2 Trung Tự',
      lat: 21.0084,
      lng: 105.8327
    },
    description: 'Bánh đúc dẻo quánh ngập trong nước dùng xương đậm đà, phủ đầy thịt băm xào mộc nhĩ nấm hương và hành phi thơm lừng.',
    priceRange: '20.000đ - 30.000đ',
    bestWeather: ['cold', 'windy', 'rainy'],
    recommendationReason: 'Món ăn vặt thơm ngậy bình dân sưởi ấm chiếc bụng đói vào buổi chiều đông Hà Nội se sắt.'
  },
  {
    id: 'f7',
    name: 'Nộm Bò Khô Long Vi Dung',
    type: 'food',
    category: 'Đồ ăn vặt',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: '23 Hồ Hoàn Kiếm',
      lat: 21.0310,
      lng: 105.8530
    },
    description: 'Đu đủ bào giòn sần sật trộn với thịt bò khô cắt lát, lá lách, gân bò dai sần sật rưới dấm tỏi ớt chua cay ngọt.',
    priceRange: '35.000đ - 50.000đ',
    bestWeather: ['hot', 'sunny', 'humid', 'cool'],
    recommendationReason: 'Hương vị cay tê giòn ngon kết hợp uống trà chanh thích hợp nhâm nhi ngắm phố phường chiều hè rực rỡ.'
  },
  {
    id: 'f8',
    name: 'Chả Cá Lã Vọng',
    type: 'food',
    category: 'Món khác',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: '14 Chả Cá',
      lat: 21.0352,
      lng: 105.8492
    },
    description: 'Cá lăng nướng vàng đều cuốn hành thì là trên chảo mỡ sôi xèo xèo, ăn kèm bún, đậu phộng và mắm tôm nồng nàn.',
    priceRange: '150.000đ - 200.000đ',
    bestWeather: ['cold', 'cool', 'rainy'],
    recommendationReason: 'Nét tinh hoa ẩm thực Tràng An dạt dào hương vị, rất thơ mộng thưởng thức trong một ngày Hà Nội thu se lạnh.'
  },
  {
    id: 'f9',
    name: 'Bánh Mì Dân Tổ',
    type: 'food',
    category: 'Bánh mì',
    location: {
      ward: 'Phường Ba Đình',
      addressDetail: 'Ngã ba Cao Thắng - Trần Nhật Duật',
      lat: 21.0412,
      lng: 105.8505
    },
    description: 'Chiếc bánh mì kẹp nhân hỗn hợp xúc xích, pate, trứng, bơ được xào xèo nhuyễn mịn ngon độc lạ.',
    priceRange: '25.000đ - 40.000đ',
    bestWeather: ['cool', 'cold', 'windy'],
    recommendationReason: 'Phong cách ẩm thực đêm nổi tiếng, trải nghiệm tuyệt vời cho đêm Hà Nội mát mẻ lộng gió.'
  },
  {
    id: 'f10',
    name: 'Bún Ốc Sườn Cô Giang',
    type: 'food',
    category: 'Bún',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: '36 Lương Ngọc Quyến',
      lat: 21.0345,
      lng: 105.8518
    },
    description: 'Nước dùng chua thanh vị giấm bỗng nếp thơm ngon, ốc bưu béo ngậy kèm sườn sụn mềm giòn.',
    priceRange: '45.000đ - 65.000đ',
    bestWeather: ['rainy', 'cold', 'cool', 'humid'],
    recommendationReason: 'Vị bỗng rượu chua chua ấm nồng làm dịu đi cảm giác ẩm ướt hoặc giá buốt khó chịu của thời tiết.'
  },
 
  // DRINKS
  {
    id: 'd1',
    name: 'Cà Phê Trứng Giảng',
    type: 'drink',
    category: 'Cà phê',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: 'Ngõ 39 Nguyễn Hữu Huân',
      lat: 21.0335,
      lng: 105.8548
    },
    description: 'Thức uống huyền thoại của Hà Nội với lớp kem trứng đánh bông xốp béo ngậy, mịn màng quyện cùng cà phê phin đậm đà thơm ấm.',
    priceRange: '35.000đ - 45.000đ',
    bestWeather: ['cold', 'rainy', 'windy'],
    recommendationReason: 'Độ ấm áp mượt mà của kem trứng nóng hổi là mảnh ghép hoàn hảo sưởi ấm những ngày mưa gió mùa thổi.',
    branches: [
      { id: 'br_d1_1', name: 'Cơ sở Nguyễn Hữu Huân', address: 'Ngõ 39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội' },
      { id: 'br_d1_2', name: 'Cơ sở Yên Phụ', address: '106 Yên Phụ, Tây Hồ, Hà Nội' }
    ]
  },
  {
    id: 'd2',
    name: 'Cà Phê Cốt Dừa Cộng',
    type: 'drink',
    category: 'Cà phê',
    location: {
      ward: 'Phường Ba Đình',
      addressDetail: 'Hồ Trúc Bạch',
      lat: 21.0450,
      lng: 105.8400
    },
    description: 'Sự hòa quyện tuyệt vời giữa vị đắng cà phê sánh mịn và lớp kem dừa đá xay ngọt ngào, thơm béo cốt dừa tươi.',
    priceRange: '45.000đ - 55.000đ',
    bestWeather: ['hot', 'sunny', 'humid'],
    recommendationReason: 'Hương vị dừa đá xay ngọt mát buốt họng đánh tan cái nóng bức bối tủi thân của mùa hè Hà Nội.',
    branches: [
      { id: 'br_d2_1', name: 'Cộng Cà Phê Trúc Bạch', address: '4 Hồ Trúc Bạch, Ba Đình, Hà Nội' },
      { id: 'br_d2_2', name: 'Cộng Cà Phê Nhà Thờ', address: '27 Nhà Thờ, Hoàn Kiếm, Hà Nội' },
      { id: 'br_d2_3', name: 'Cộng Cà Phê Hàng Hành', address: 'Phố Hàng Hành, Hoàn Kiếm, Hà Nội' },
      { id: 'br_d2_4', name: 'Cộng Cà Phê Thái Hà', address: '101 Hoàng Cầu, Đống Đa, Hà Nội' }
    ]
  },
  {
    id: 'd3',
    name: 'Trà Sen Tây Hồ',
    type: 'drink',
    category: 'Trà',
    location: {
      ward: 'Phường Tây Hồ',
      addressDetail: 'Hồ Tây lộng gió, Quảng An',
      lat: 21.0665,
      lng: 105.8278
    },
    description: 'Trà mộc Tân Cương ướp trong bông hoa sen bách diệp Hồ Tây, lưu giữ hương thơm thanh khiết tinh khôi như đất trời Hà Nội.',
    priceRange: '40.000đ - 80.000đ',
    bestWeather: ['cool', 'sunny', 'windy'],
    recommendationReason: 'Ngồi ngắm hoàng hôn Hồ Tây lộng gió ngày thu, nhấp ngụm chè sen thanh mát là cảm xúc yên bình trọn vẹn nhất.'
  },
  {
    id: 'd4',
    name: 'Bạc Xỉu Đá Hàng Hành',
    type: 'drink',
    category: 'Cà phê',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: 'Phố Hàng Hành cổ kính',
      lat: 21.0318,
      lng: 105.8508
    },
    description: 'Nước cốt sữa đặc thơm nồng quyện cùng cốt dừa beo béo và một shot espresso đắng nhẹ rưới đá.',
    priceRange: '30.000đ - 45.000đ',
    bestWeather: ['sunny', 'hot', 'warm'],
    recommendationReason: 'Thức uống dồi dào năng lượng tuyệt vời cho một buổi hẹn hò thong thả dạo quanh phố cổ đầy nắng ấm.'
  },
  {
    id: 'd5',
    name: 'Trà Đào Sả Đá',
    type: 'drink',
    category: 'Trà',
    location: {
      ward: 'Phường Cầu Giấy',
      addressDetail: 'Phố Chùa Hà',
      lat: 21.0370,
      lng: 105.7955
    },
    description: 'Trà hồng đào ngọt thanh thoang thoảng hương sả ấm nồng quyến rũ, kèm những miếng đào tươi giòn sần sật mát lạnh.',
    priceRange: '35.000đ - 50.000đ',
    bestWeather: ['hot', 'sunny', 'warm'],
    recommendationReason: 'Giải nhiệt hiệu quả, vị chua ngọt thơm nồng khơi gợi hứng khởi vui vẻ đi dạo.'
  },
  {
    id: 'd6',
    name: 'Cà Phê Muối Hà Nội',
    type: 'drink',
    category: 'Cà phê',
    location: {
      ward: 'Phường Kim Liên',
      addressDetail: 'Phố Hoàng Tích Trí',
      lat: 21.0090,
      lng: 105.8340
    },
    description: 'Lớp kem mặn béo ngậy cân bằng tinh tế vị đắng gắt và ngọt lịm của cà phê phin sữa đặc truyền thống.',
    priceRange: '25.000đ - 35.000đ',
    bestWeather: ['cool', 'windy', 'warm', 'cold'],
    recommendationReason: 'Cực kỳ phù hợp cho những ngày mát mẻ, vị mặn nhẹ đậm đà khơi gợi nhiều câu chuyện ngẫu hứng.'
  },
  {
    id: 'd7',
    name: 'Trà Chanh Nhà Thờ Lớn',
    type: 'drink',
    category: 'Trà',
    location: {
      ward: 'Phường Hoàn Kiếm',
      addressDetail: '2 Nhà Thờ',
      lat: 21.0287,
      lng: 105.8488
    },
    description: 'Nét văn hóa vỉa hè kinh điển của giới trẻ Hà Nội với trà nhài chanh mát chua, nhâm nhi đĩa hướng dương giòn.',
    priceRange: '15.000đ - 25.000đ',
    bestWeather: ['hot', 'sunny', 'cool'],
    recommendationReason: 'Trải nghiệm hè chân thực nhất của Hà Nội. Ngồi vỉa hè hóng gió mát ngắm Nhà Thờ Lớn thì tuyệt vời.'
  },
  {
    id: 'd8',
    name: 'Cacao Cốt Dừa Thụy Khuê',
    type: 'drink',
    category: 'Đồ uống khác',
    location: {
      ward: 'Phường Tây Hồ',
      addressDetail: 'Đường ven hồ Thụy Khuê',
      lat: 21.0425,
      lng: 105.8235
    },
    description: 'Cacao nguyên chất đắng đậm đà rắc bột dừa nạo giòn xốp nấu cốt dừa nóng thơm lừng ẩm mượt.',
    priceRange: '30.000đ - 45.000đ',
    bestWeather: ['cold', 'rainy', 'windy'],
    recommendationReason: 'Sự nồng ấm ngọt ngào sảng khoái giúp xua tan nhanh chóng cảm giác ẩm ướt gió lạnh tràn về.'
  }
];

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
