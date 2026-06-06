import React from 'react';
import { WheelItem } from '../types';

interface AddPlaceFormProps {
  newItemName: string;
  setNewItemName: (v: string) => void;
  newItemType: 'food' | 'drink';
  setNewItemType: (v: 'food' | 'drink') => void;
  newItemCategory: string;
  setNewItemCategory: (v: string) => void;
  customNewItemCategory: string;
  setCustomNewItemCategory: (v: string) => void;
  newItemWard: string;
  setNewItemWard: (v: string) => void;
  newItemAddress: string;
  setNewItemAddress: (v: string) => void;
  newItemPrice: string;
  setNewItemPrice: (v: string) => void;
  newItemWeather: string[];
  setNewItemWeather: React.Dispatch<React.SetStateAction<string[]>>;
  foodCategories: string[];
  drinkCategories: string[];
  HANOI_MERGED_WARDS: string[];
  handleAddNewItem: (e: React.FormEvent) => Promise<void>;
}

export default function AddPlaceForm({
  newItemName,
  setNewItemName,
  newItemType,
  setNewItemType,
  newItemCategory,
  setNewItemCategory,
  customNewItemCategory,
  setCustomNewItemCategory,
  newItemWard,
  setNewItemWard,
  newItemAddress,
  setNewItemAddress,
  newItemPrice,
  setNewItemPrice,
  newItemWeather,
  setNewItemWeather,
  foodCategories,
  drinkCategories,
  HANOI_MERGED_WARDS,
  handleAddNewItem
}: AddPlaceFormProps) {
  return (
    <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047]">
      <h2 className="text-lg font-black text-[#2D3047] mb-3 flex items-center gap-2">
        <span className="w-2.5 h-6 bg-[#06D6A0] rounded-full"></span> Thêm Quán Tủ Của Bạn
      </h2>
      <form onSubmit={handleAddNewItem} className="space-y-3.5">
        <div>
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
            Tên địa điểm / món ăn *
          </label>
          <input
            id="form-item-name"
            type="text"
            required
            placeholder="Ví dụ: Cà phê Nuôi, Phở chiên phồng"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
              Loại hình
            </label>
            <select
              id="form-item-type"
              value={newItemType}
              onChange={(e) => {
                const val = e.target.value as 'food' | 'drink';
                setNewItemType(val);
                if (val === 'food') {
                  setNewItemCategory('Bún');
                } else {
                  setNewItemCategory('Cà phê');
                }
                setCustomNewItemCategory('');
              }}
              className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2 bg-[#FAF8F5]"
            >
              <option value="food">🍱 Đồ Ăn</option>
              <option value="drink">☕ Đồ Uống</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
              Danh mục món
            </label>
            <select
              id="form-item-category-select"
              value={newItemCategory}
              onChange={(e) => {
                setNewItemCategory(e.target.value);
                if (e.target.value !== 'custom_other') {
                  setCustomNewItemCategory('');
                }
              }}
              className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2 bg-[#FAF8F5]"
            >
              {(newItemType === 'food' ? foodCategories : drinkCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="custom_other">✍️ Nhập danh mục mới...</option>
            </select>
          </div>
        </div>

        {newItemCategory === 'custom_other' && (
          <div className="animate-fade-in-down">
            <label className="text-[10px] font-black text-[#EF476F] uppercase tracking-widest block mb-1 font-extrabold animate-pulse">
              ✏️ Gõ tên danh mục mới của bạn *
            </label>
            <input
              id="form-item-custom-category"
              type="text"
              required
              placeholder="Ví dụ: Đồ Hàn, Món cuốn, Trà sữa..."
              value={customNewItemCategory}
              onChange={(e) => setCustomNewItemCategory(e.target.value)}
              className="w-full text-xs font-bold border-2 border-[#EF476F] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden placeholder-stone-400"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
            Phường *
          </label>
          <select
            id="form-item-ward"
            value={newItemWard}
            onChange={(e) => setNewItemWard(e.target.value)}
            className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2.5 bg-[#FAF8F5] focus:bg-white"
          >
            {HANOI_MERGED_WARDS.map(ward => (
              <option key={ward} value={ward}>{ward}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
            Số nhà, Tên đường (địa chỉ chi tiết)
          </label>
          <input
            id="form-item-address"
            type="text"
            placeholder="Số 12 ngõ Tạm Thương"
            value={newItemAddress}
            onChange={(e) => setNewItemAddress(e.target.value)}
            className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1.5">
            Thời tiết phù hợp nhất:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { val: 'hot', label: '🔥 Nóng' },
              { val: 'cold', label: '❄️ Lạnh' },
              { val: 'cool', label: '🍃 Mát' }
            ].map((cond) => {
              const isSelected = newItemWeather.includes(cond.val);
              return (
                <button
                  id={`btn-form-weather-${cond.val}`}
                  type="button"
                  key={cond.val}
                  onClick={() => {
                    setNewItemWeather(prev =>
                      prev.includes(cond.val)
                        ? prev.filter(c => c !== cond.val)
                        : [...prev, cond.val]
                    );
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D3047] text-white border-[#2D3047]'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cond.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          id="btn-add-food"
          type="submit"
          className="w-full bg-[#06D6A0] hover:bg-[#0fd9a5] text-[#2D3047] font-black px-4 py-3 rounded-xl uppercase tracking-wider text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer active:translate-y-0.5 active:shadow-none"
        >
          + Lưu vào thực đơn quay
        </button>
      </form>
    </div>
  );
}
