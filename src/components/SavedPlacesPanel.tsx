import React from 'react';
import { Trash2, HelpCircle, Map as MapIcon } from 'lucide-react';
import { WheelItem } from '../types';
import { getGoogleMapsSearchUrl } from '../data';

interface SavedPlacesPanelProps {
  customItems: WheelItem[];
  processedSavedItems: WheelItem[];
  savedListActiveType: 'food' | 'drink';
  setSavedListActiveType: (type: 'food' | 'drink') => void;
  savedListWards: string[];
  setSavedListWards: React.Dispatch<React.SetStateAction<string[]>>;
  sortByDistance: boolean;
  setSortByDistance: (s: boolean) => void;
  savedListSubCat: string;
  setSavedListSubCat: (c: string) => void;
  foodCategories: string[];
  drinkCategories: string[];
  userCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  handleLocateUser: () => void;
  setSelectedDetailItem: (item: WheelItem) => void;
  handleDeleteItem: (id: string, e: React.MouseEvent) => Promise<void>;
  HANOI_MERGED_WARDS: string[];
}

export default function SavedPlacesPanel({
  customItems,
  processedSavedItems,
  savedListActiveType,
  setSavedListActiveType,
  savedListWards,
  setSavedListWards,
  sortByDistance,
  setSortByDistance,
  savedListSubCat,
  setSavedListSubCat,
  foodCategories,
  drinkCategories,
  userCoords,
  isLocating,
  handleLocateUser,
  setSelectedDetailItem,
  handleDeleteItem,
  HANOI_MERGED_WARDS
}: SavedPlacesPanelProps) {

  const toggleSavedListWard = (ward: string) => {
    setSavedListWards(prev => {
      if (prev.includes(ward)) {
        return prev.filter(w => w !== ward);
      } else {
        return [...prev, ward];
      }
    });
  };

  return (
    <div className="w-full bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047] flex flex-col justify-start min-h-[460px]">
      <h3 className="text-sm font-black text-[#2D3047] mb-3 uppercase tracking-wider flex items-center justify-between">
        <span>🏪 Quán Tủ Đã Lưu ({customItems.length})</span>
      </h3>

      {/* TWO TABS: Quán ăn & Quán nước */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          id="btn-saved-food-tab"
          type="button"
          onClick={() => {
            setSavedListActiveType('food');
            setSavedListSubCat('all');
          }}
          className={`py-2 rounded-xl border-2 border-[#2D3047] font-black text-xs uppercase tracking-wider transition-all shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none ${savedListActiveType === 'food'
            ? 'bg-[#EF476F] text-white'
            : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
        >
          <span>🍱 Quán Ăn</span>
        </button>
        <button
          id="btn-saved-drink-tab"
          type="button"
          onClick={() => {
            setSavedListActiveType('drink');
            setSavedListSubCat('all');
          }}
          className={`py-2 rounded-xl border-2 border-[#2D3047] font-black text-xs uppercase tracking-wider transition-all shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none ${savedListActiveType === 'drink'
            ? 'bg-[#118AB2] text-white'
            : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
        >
          <span>☕ Quán Nước</span>
        </button>
      </div>

      {/* ADVANCED FILTER BOX FOR SAVED LIST */}
      <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-3.5 mb-4 shadow-[2.5px_2.5px_0px_#2D3047] text-left" id="saved-list-filters-section">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-[#2D3047] uppercase tracking-widest flex items-center gap-1">
            🔍 BỘ LỌC QUÁN TỦ
          </span>
          {(savedListWards.length !== HANOI_MERGED_WARDS.length || sortByDistance || savedListSubCat !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSavedListWards(HANOI_MERGED_WARDS);
                setSortByDistance(false);
                setSavedListSubCat('all');
              }}
              className="text-[9px] font-black text-rose-500 hover:underline cursor-pointer border-none bg-transparent"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Ward Filter (Checkboxes) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                Chọn Phường ({savedListWards.length} đã chọn):
              </label>
              <div className="flex gap-1 text-[8px] font-bold">
                <button
                  type="button"
                  onClick={() => setSavedListWards(HANOI_MERGED_WARDS)}
                  className="text-[#FF6B35] hover:underline cursor-pointer border-none bg-transparent"
                >
                  Tất cả
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={() => setSavedListWards([])}
                  className="text-stone-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  Dọn lọc
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 max-h-[100px] overflow-y-auto border border-stone-200 rounded-xl p-1.5 bg-white pr-1">
              {HANOI_MERGED_WARDS.map(ward => {
                const isChecked = savedListWards.includes(ward);
                return (
                  <button
                    key={`saved-ward-${ward}`}
                    type="button"
                    onClick={() => toggleSavedListWard(ward)}
                    className={`flex items-center gap-1 p-1 rounded-sm text-left text-[9px] font-bold truncate transition-all cursor-pointer border-none ${isChecked
                      ? 'bg-rose-50/10 text-[#EF476F] font-black'
                      : 'text-stone-400 bg-transparent'
                      }`}
                  >
                    <span>{isChecked ? '☑' : '☐'}</span>
                    <span className="truncate">{ward.replace(/^Phường\s+/i, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geolocation Distance Tracking */}
          <div className="pt-2 border-t border-dashed border-stone-200">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">
                  Vị Trí Hiện Tại:
                </span>
                {userCoords && (
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 font-mono px-1 py-0.5 rounded border border-emerald-100 font-black">
                    📍 Đã định vị
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-geolocate-user"
                  type="button"
                  onClick={handleLocateUser}
                  disabled={isLocating}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border-2 border-[#2D3047] font-black text-[9px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer ${userCoords
                    ? 'bg-[#06D6A0]/10 text-[#2D3047]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                >
                  <MapIcon className="w-3 h-3 text-[#FF6B35]" />
                  {isLocating ? 'Đang lấy...' : (userCoords ? 'Cập nhật định vị' : 'Định vị hiện tại')}
                </button>

                {userCoords && (
                  <button
                    type="button"
                    onClick={() => setSortByDistance(!sortByDistance)}
                    className={`px-2 py-1.5 rounded-xl border-2 border-[#2D3047] font-black text-[9px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D3047] cursor-pointer flex items-center gap-1 whitespace-nowrap ${sortByDistance
                      ? 'bg-[#FF6B35] text-white shadow-none translate-y-0.5'
                      : 'bg-white hover:bg-stone-50 text-stone-600'
                      }`}
                  >
                    ⇅ Gần nhất {sortByDistance ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Category Selector */}
          <div className="pt-2 border-t border-dashed border-stone-200">
            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block mb-1">
              Danh mục {savedListActiveType === 'food' ? 'Món Ăn' : 'Nước Uống'}:
            </label>
            <select
              id="saved-list-subcat-filter"
              value={savedListSubCat}
              onChange={(e) => setSavedListSubCat(e.target.value)}
              className="w-full text-[10px] font-bold border-2 border-[#2D3047] rounded-xl px-2 py-1.5 bg-white cursor-pointer focus:outline-hidden"
            >
              <option value="all">🏷️ Tất cả danh mục</option>
              {(savedListActiveType === 'food' ? foodCategories : drinkCategories).map(cat => (
                <option key={`saved-cat-opt-${cat}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {processedSavedItems.length > 0 ? (
        <div className="space-y-4 overflow-y-auto pr-1 max-h-[440px] flex-1">
          <div className="space-y-2.5">
            <div className="sticky top-0 bg-white z-10 py-1 border-b border-dashed border-stone-200 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#2D3047] uppercase tracking-wider flex items-center gap-1.5">
                {savedListActiveType === 'food' ? '🍱 QUÁN ĂN ĐÃ LỌC' : '☕ QUÁN NƯỚC ĐÃ LỌC'} ({processedSavedItems.length})
              </span>
            </div>
            {processedSavedItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4.5px_4.5px_0px_#2D3047] transition-all duration-150 flex flex-col gap-2 justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-[#2D3047] text-xs inline leading-snug">{item.name}</h4>
                      {item.category && (
                        <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded-md ${item.type === 'food'
                          ? 'bg-[#EF476F]/10 text-[#EF476F] border-[#EF476F]/20'
                          : 'bg-[#118AB2]/10 text-[#118AB2] border-[#118AB2]/20'
                          }`}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 font-bold mt-1">
                      📍 {item.location.addressDetail ? `${item.location.addressDetail}, ` : ''}{item.location.ward}
                    </p>

                    {/* Branch indicator */}
                    {item.branches && item.branches.length > 0 && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <div className="text-[9px] font-black text-[#FF6B35] bg-[#FFF2EB] border border-[#FFD166]/30 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 self-start">
                          🏢 Có {item.branches.length} cơ sở khác
                        </div>
                        <div className="pl-2 border-l-2 border-stone-200 text-[8px] text-stone-400 font-semibold italic mt-0.5">
                          Ví dụ: {item.branches[0].address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-600 flex-wrap">
                  {item.reviews && item.reviews.length > 0 ? (
                    <span className="bg-[#FFFBF5] text-[#EF476F] border border-[#2D3047]/15 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                      ⭐ {(item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)} ({item.reviews.length})
                    </span>
                  ) : (
                    <span className="bg-[#FFFBF5] text-stone-400 border border-[#2D3047]/15 px-1.5 py-0.5 rounded-sm font-semibold">
                      Chưa có đánh giá
                    </span>
                  )}

                  {/* Calculated distance tag */}
                  {item.calculatedDistance !== undefined && (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-250 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 font-bold font-mono">
                      🚗 Cách {item.calculatedDistance.toFixed(1)} km
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 border-t border-dashed border-[#2D3047]/15 pt-2 mt-0.5">
                  <button
                    id={`btn-detail-custom-item-side-${item.id}`}
                    type="button"
                    onClick={() => setSelectedDetailItem(item)}
                    className="p-1 px-2 bg-amber-50 hover:bg-amber-100 text-[#FF6B35] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 font-black text-[9px] uppercase flex items-center gap-1 active:translate-y-0.5 active:shadow-none"
                    title="Xem Chi tiết & Chỉnh sửa"
                  >
                    📝 Chi tiết
                  </button>
                  <a
                    id={`btn-go-custom-item-side-${item.id}`}
                    href={getGoogleMapsSearchUrl(item.name, item.location.addressDetail, item.location.ward)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-[#118AB2] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 font-black text-[9px] uppercase flex items-center gap-1 active:translate-y-0.5 active:shadow-none no-underline"
                  >
                    🗺️ Bản đồ
                  </a>
                  <button
                    id={`btn-delete-custom-item-side-${item.id}`}
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1 px-2 bg-red-50 hover:bg-red-100 text-[#EF476F] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 active:translate-y-0.5 active:shadow-none flex items-center justify-center border-none"
                    title="Xóa khỏi tủ quán"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-200 rounded-2xl bg-[#FAF8F5]">
          <HelpCircle className="w-10 h-10 text-stone-300 mb-2.5 animate-pulse" />
          <p className="text-xs font-bold text-[#2D3047] uppercase">Không có quán tủ khớp bộ lọc!</p>
          <p className="text-[10px] text-stone-400 mt-1 max-w-[200px]">
            Hãy đổi bộ lọc phường, mở rộng danh mục, lọc loại món/nước tương ứng, hoặc dùng biểu mẫu thêm quán ở cột bên trái.
          </p>
        </div>
      )}
    </div>
  );
}
