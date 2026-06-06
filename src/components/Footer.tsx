import React from 'react';

export default function Footer() {
  return (
    <footer id="hanoi-footer" className="mt-auto h-14 bg-[#2D3047] text-white flex flex-col md:flex-row items-center px-8 justify-between text-[11px] font-bold shrink-0 gap-2 border-t-4 border-[#FF6B35] py-2">
      <div className="flex gap-4">
        <span>© 2026 LAMBOM WHEEL</span>
        <span className="text-gray-400">|</span>
        <span>DỮ LIỆU TỰ ĐỘNG ĐO ĐẠC METEO API</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        AI SẴN SÀNG PHÂN TÍCH VÒNG QUAY MAY MẮN
      </div>
    </footer>
  );
}
