/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WheelItem } from '../types';
import { calculateDistanceInKm } from '../data';
import { Search, MapPin, Star, Plus, Check, Loader2, AlertCircle, Compass, Map, Navigation } from 'lucide-react';

interface GoogleMapsSearchProps {
  activeItems: WheelItem[];
  onAddItem: (item: WheelItem) => void;
  onRemoveItem: (id: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  onLocateUser?: () => void;
  onSetMockLocation?: () => void;
  isLocating?: boolean;
}

export default function GoogleMapsSearch({
  activeItems,
  onAddItem,
  onRemoveItem,
  userCoords = null,
  onLocateUser,
  onSetMockLocation,
  isLocating = false
}: GoogleMapsSearchProps) {
  const [query, setQuery] = useState('');
  const [customAddress, setCustomAddress] = useState('Hồ Hoàn Kiếm, Hà Nội');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<WheelItem[]>([]);

  // Sắp xếp kết quả tìm kiếm theo khoảng cách gần nhất, nếu cùng khoảng cách (làm tròn 100m) thì xếp theo đánh giá cao nhất
  const sortedResults = React.useMemo(() => {
    if (!userCoords) return results;
    return [...results].sort((a, b) => {
      const aLat = a.location?.lat;
      const aLng = a.location?.lng;
      const bLat = b.location?.lat;
      const bLng = b.location?.lng;

      const aHasCoors = aLat !== undefined && aLng !== undefined;
      const bHasCoors = bLat !== undefined && bLng !== undefined;

      if (!aHasCoors && !bHasCoors) return 0;
      if (!aHasCoors) return 1;
      if (!bHasCoors) return -1;

      const distA = calculateDistanceInKm(userCoords.lat, userCoords.lng, aLat!, aLng!);
      const distB = calculateDistanceInKm(userCoords.lat, userCoords.lng, bLat!, bLng!);

      // Làm tròn khoảng cách đến 0.1 km (100 mét)
      const groupA = Math.round(distA * 10) / 10;
      const groupB = Math.round(distB * 10) / 10;

      if (groupA !== groupB) {
        return distA - distB; // Ưu tiên khoảng cách gần hơn
      }

      // Nếu cùng khoảng cách (chênh lệch dưới 100m), ưu tiên đánh giá trung bình cao nhất
      const ratingA = a.reviews && a.reviews.length > 0
        ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length
        : 0;
      const ratingB = b.reviews && b.reviews.length > 0
        ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length
        : 0;

      if (ratingA !== ratingB) {
        return ratingB - ratingA; // Đánh giá cao hơn xếp trước
      }

      return distA - distB;
    });
  }, [results, userCoords]);


  // Update manual address name if user coordinates change or to notify about simulated address
  useEffect(() => {
    if (userCoords) {
      if (userCoords.lat === 21.0285 && userCoords.lng === 105.8521) {
        setCustomAddress('Hồ Hoàn Kiếm (Mô phỏng), Hà Nội');
      } else {
        setCustomAddress(`Tọa độ GPS: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`);
      }
    }
  }, [userCoords]);

  const executeSearch = async (searchKeyword: string) => {
    const cleanQuery = searchKeyword.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      let url = `/api/serpapi/search?q=${encodeURIComponent(cleanQuery)}`;
      if (userCoords) {
        url += `&lat=${userCoords.lat}&lng=${userCoords.lng}`;
      } else {
        // If they entered a manual address but have no GPS, we search with address appended
        if (customAddress && customAddress !== 'Hồ Hoàn Kiếm, Hà Nội') {
          url = `/api/serpapi/search?q=${encodeURIComponent(cleanQuery + " gần " + customAddress)}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "apiKey_missing") {
          setErrorStatus("apiKey_missing");
          setErrorMessage(data.message);
        } else {
          throw new Error(data.error || "Có lỗi bất ngờ khi truy xuất.");
        }
      } else {
        setResults(data.results || []);
        if (data.results?.length === 0) {
          setErrorMessage("Không tìm thấy kết quả phù hợp tại khu vực Hà Nội. Hãy thử từ khóa khác như 'bún chả', 'cà phê', 'phở', 'lẩu'...");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("general_error");
      setErrorMessage(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleProximitySearch = (keyword: string) => {
    setQuery(keyword);
    executeSearch(keyword);
  };

  const toggleItemImport = (item: WheelItem) => {
    const exists = activeItems.some(it => it.id === item.id);
    if (exists) {
      onRemoveItem(item.id);
    } else {
      onAddItem(item);
    }
  };

  return (
    <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047]">
      <h2 className="text-base font-black text-[#2D3047] mb-3 flex items-center gap-2">
        <span className="w-2.5 h-6 bg-[#118AB2] rounded-full"></span> 🔍 Tìm Kiếm Quán Ăn Gần Đây
      </h2>

      <p className="text-[10px] text-stone-500 font-semibold mb-3 leading-relaxed">
        Quét dữ liệu Google Maps thật (SerpApi) quanh vị trí của bạn để nhập nhanh 20+ quán ngon vào vòng quay & bản đồ:
      </p>

      {/* BLOCK 1: VỊ TRÍ HIỆN TẠI & TOẠ ĐỘ SƠ KHỞI */}
      <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 mb-4 space-y-2.5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#2D3047] uppercase tracking-wider flex items-center gap-1.5">
            📍 VỊ TRÍ XUẤT PHÁT CỦA BẠN
          </span>
          {userCoords ? (
            <span className="text-[9px] bg-emerald-500 text-white font-mono px-1.5 py-0.5 rounded-md border-2 border-stone-850 font-black">
              ĐÃ ĐÈN GPS
            </span>
          ) : (
            <span className="text-[9px] bg-amber-500 text-stone-900 font-mono px-1.5 py-0.5 rounded-md border-2 border-stone-850 font-black">
              MẶC ĐỊNH
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={onLocateUser}
            disabled={isLocating}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border-2 border-[#2D3047] font-black text-[10px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer ${userCoords
                ? 'bg-[#06D6A0]/10 text-[#2D3047]'
                : 'bg-white hover:bg-stone-50 text-stone-700'
              }`}
          >
            <Compass className={`w-3.5 h-3.5 text-[#FF6B35] ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Đang đọc...' : (userCoords ? 'Đổi GPS Mới' : 'Định vị GPS')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSetMockLocation) onSetMockLocation();
            }}
            className="bg-white hover:bg-stone-50 border-2 border-[#2D3047] text-[#2D3047] font-black text-[10px] py-1.5 px-1 rounded-xl transition-all shadow-[1.5px_1.5px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer uppercase flex items-center justify-center gap-1"
          >
            <Map className="w-3.5 h-3.5 text-[#118AB2]" />
            <span>Đặt mốc Hồ Gươm</span>
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">
            Địa chỉ hiện tại hoặc vùng lân cận:
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Hồ Hoàn Kiếm, Hà Nội hoặc Cầu Giấy..."
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            className="w-full text-[11px] font-extrabold border-2 border-[#2D3047] rounded-xl px-2.5 py-1.5 bg-white focus:outline-hidden"
          />
          {userCoords && (
            <p className="text-[8px] text-emerald-600 font-mono font-black italic">
              🎯 Tọa độ GPS đang đồng bộ: {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {/* QUICK PROXIMITY SEARCH OF 20 PLACES */}
      <div className="mb-4 space-y-1.5">
        <label className="text-[9.5px] font-black text-[#FF6B35] uppercase tracking-wider block text-left">
          ⚡ TÌM NHANH 20 QUÁN GẦN NHẤT THEO VỊ TRÍ TRÊN:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleProximitySearch("món ăn ngon Hà Nội")}
            disabled={loading}
            className="bg-[#EF476F] hover:bg-[#ff5a7f] disabled:bg-stone-100 text-white font-black text-[10px] py-2 px-1.5 rounded-xl border-2 border-[#2D3047] uppercase tracking-wider transition-all shadow-[2px_2px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            🍱 20 Quán Ăn Gần Tôi
          </button>
          <button
            type="button"
            onClick={() => handleProximitySearch("quán cà phê trà sữa Hà Nội")}
            disabled={loading}
            className="bg-[#118AB2] hover:bg-[#1f9cc6] disabled:bg-stone-100 text-white font-black text-[10px] py-2 px-1.5 rounded-xl border-2 border-[#2D3047] uppercase tracking-wider transition-all shadow-[2px_2px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            ☕ 20 Quán Nước Gần Tôi
          </button>
        </div>
      </div>

      {/* Manual query text form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            id="input-serpapi-query"
            type="text"
            required
            placeholder="Hoặc gõ từ khóa: bún chả, phở bò, trà chanh..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl pl-9 pr-3 py-2 bg-[#FAF8F5] focus:bg-white focus:outline-hidden disabled:opacity-75"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
        </div>
        <button
          id="btn-serpapi-search-submit"
          type="submit"
          disabled={loading}
          className="bg-[#FF6B35] hover:bg-[#ff7b4b] disabled:bg-stone-200 text-white font-extrabold px-3.5 py-2 rounded-xl border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] active:translate-y-0.5 active:shadow-none text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            'Tìm'
          )}
        </button>
      </form>

      {/* Loading view */}
      {loading && (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl">
          <Loader2 className="w-6 h-6 text-[#118AB2] animate-spin" />
          <p className="text-[11px] font-bold text-stone-600 font-mono">Đang quét dữ liệu Google Maps thật...</p>
        </div>
      )}

      {/* Missing API Key Warning Box */}
      {errorStatus === "apiKey_missing" && (
        <div className="bg-[#FFFDF6] border-2 border-[#FFE3A8] rounded-2xl p-4 text-stone-800 text-[11px] font-medium space-y-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#E68A00] font-bold">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>Cần cấu hình SERPAPI_API_KEY</span>
          </div>
          <p className="leading-relaxed text-stone-600">
            Ứng dụng cần có <strong>SerpApi Key</strong> để kết nối trực tiếp đến dữ liệu địa điểm thật của Google Maps.
          </p>
          <div className="bg-white border border-[#FFF0D0] rounded-xl p-2.5 space-y-1.5 text-left">
            <p className="font-bold text-[#FF6B35]">3 bước nhận key miễn phí:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-stone-500">
              <li>Đăng ký tại <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-[#118AB2] underline font-bold">serpapi.com</a> để có ngay 100 lượt tìm kiếm miễn phí hàng tháng.</li>
              <li>Nhấp chọn thẻ <strong>⚙️ Settings (Secrets)</strong> ở trên cùng góc phải của AI Studio.</li>
              <li>Thêm biến mới: <code className="bg-stone-50 text-stone-700 font-mono text-[9px] border border-stone-200 px-1 py-0.5 rounded">SERPAPI_API_KEY</code> và dán khóa API của bạn vào đó. Lưu lại và tận hưởng tìm kiếm thật trực quan!</li>
            </ol>
          </div>
        </div>
      )}

      {/* General error message */}
      {!loading && errorStatus !== "apiKey_missing" && errorMessage && (
        <div className="p-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl text-[11px] font-bold flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results lists */}
      {!loading && sortedResults.length > 0 && (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          <p className="text-[9px] text-[#118AB2] font-black uppercase tracking-wider mb-2 text-left">
            Tìm thấy {sortedResults.length} quán gần nhất quanh vị trí:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {sortedResults.map(item => {
              const isImported = activeItems.some(it => it.id === item.id);

              // Calculate real-time distance relative to user position if GPS coordinates exist
              const hasCoors = item.location?.lat !== undefined && item.location?.lng !== undefined;
              const distance = (hasCoors && userCoords)
                ? calculateDistanceInKm(userCoords.lat, userCoords.lng, item.location.lat!, item.location.lng!)
                : null;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border-2 transition-all flex items-start justify-between gap-3 text-xs text-left ${isImported
                      ? 'bg-[#F2FAFC] border-[#118AB2]'
                      : 'bg-[#FFFBF5] border-[#2D3047] hover:bg-white shadow-[2px_2px_0px_#2D3047]'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-[#2D3047] truncate leading-tight flex items-center gap-1">
                      <span>{item.type === 'food' ? '🍱' : '☕'}</span>
                      <span className="truncate">{item.name}</span>
                    </h4>

                    {item.location.addressDetail && (
                      <p className="text-[10px] text-stone-500 font-semibold truncate mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{item.location.addressDetail}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="text-[9px] text-stone-400 font-bold">
                        Ranh giới: <strong className="text-stone-600 font-extrabold">{item.location.ward.replace(/^Phường\s+/i, '')}</strong>
                      </span>
                      {distance !== null && (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black px-1 rounded-sm shrink-0 font-mono">
                          🚗 Cách {distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    id={`btn-import-place-${item.id}`}
                    type="button"
                    onClick={() => toggleItemImport(item)}
                    className={`shrink-0 flex items-center justify-center p-1.5 rounded-lg border-2 transition-all cursor-pointer ${isImported
                        ? 'bg-[#06D6A0] text-white border-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                        : 'bg-white hover:bg-stone-100 text-[#2D3047] border-[#2D3047] shadow-[1.5px_1.5px_0px_#2D3047]'
                      }`}
                    title={isImported ? "Xóa khỏi thực đơn" : "Thêm vào thực đơn & bản đồ"}
                  >
                    {isImported ? (
                      <Check className="w-4 h-4 font-black" />
                    ) : (
                      <Plus className="w-4 h-4 font-black" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
