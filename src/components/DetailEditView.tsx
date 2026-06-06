import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { WheelItem, Review, Branch, ItemType } from '../types';
import { getGoogleMapsSearchUrl } from '../data';

interface DetailEditViewProps {
  selectedDetailItem: WheelItem | null;
  setSelectedDetailItem: (item: WheelItem | null) => void;
  editName: string;
  setEditName: (v: string) => void;
  editType: ItemType;
  setEditType: (v: ItemType) => void;
  editWard: string;
  setEditWard: (v: string) => void;
  editAddress: string;
  setEditAddress: (v: string) => void;
  editPrice: string;
  setEditPrice: (v: string) => void;
  editBestWeather: string[];
  setEditBestWeather: React.Dispatch<React.SetStateAction<string[]>>;
  editCategory: string;
  setEditCategory: (v: string) => void;
  customEditCategory: string;
  setCustomEditCategory: (v: string) => void;
  editReviews: Review[];
  setEditReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  editBranches: Branch[];
  setEditBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  foodCategories: string[];
  drinkCategories: string[];
  HANOI_MERGED_WARDS: string[];
  handleSaveEditedItem: (e: React.FormEvent) => Promise<void>;
  newBranchName: string;
  setNewBranchName: (v: string) => void;
  newBranchAddress: string;
  setNewBranchAddress: (v: string) => void;
  newReviewComment: string;
  setNewReviewComment: (v: string) => void;
  newReviewRating: number;
  setNewReviewRating: (v: number) => void;
  reviewPrice: 'rẻ' | 'vừa' | 'đắt';
  setReviewPrice: (v: 'rẻ' | 'vừa' | 'đắt') => void;
  reviewQuantity: 'ít' | 'no' | 'nhiều';
  setReviewQuantity: (v: 'ít' | 'no' | 'nhiều') => void;
  reviewHygiene: 'sạch sẽ' | 'bẩn';
  setReviewHygiene: (v: 'sạch sẽ' | 'bẩn') => void;
  reviewSpace: 'rộng rãi - thoáng mát' | 'chật chội - nóng nực';
  setReviewSpace: (v: 'rộng rãi - thoáng mát' | 'chật chội - nóng nực') => void;
  reviewParking: 'có' | 'không';
  setReviewParking: (v: 'có' | 'không') => void;
}

export default function DetailEditView({
  selectedDetailItem,
  setSelectedDetailItem,
  editName,
  setEditName,
  editType,
  setEditType,
  editWard,
  setEditWard,
  editAddress,
  setEditAddress,
  editPrice,
  setEditPrice,
  editBestWeather,
  setEditBestWeather,
  editCategory,
  setEditCategory,
  customEditCategory,
  setCustomEditCategory,
  editReviews,
  setEditReviews,
  editBranches,
  setEditBranches,
  foodCategories,
  drinkCategories,
  HANOI_MERGED_WARDS,
  handleSaveEditedItem,
  newBranchName,
  setNewBranchName,
  newBranchAddress,
  setNewBranchAddress,
  newReviewComment,
  setNewReviewComment,
  newReviewRating,
  setNewReviewRating,
  reviewPrice,
  setReviewPrice,
  reviewQuantity,
  setReviewQuantity,
  reviewHygiene,
  setReviewHygiene,
  reviewSpace,
  setReviewSpace,
  reviewParking,
  setReviewParking
}: DetailEditViewProps) {
  if (!selectedDetailItem) return null;

  return (
    <div id="full-detail-edit-container" className="col-span-12 bg-white border-4 border-[#2D3047] rounded-[36px] p-6 md:p-8 shadow-[8px_8px_0px_#2D3047] relative">
      {/* Header of Detail Page */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-[#2D3047] pb-5 mb-6 gap-4 font-sans">
        <div>
          <button
            id="btn-back-to-home"
            type="button"
            onClick={() => setSelectedDetailItem(null)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF6B35] hover:underline mb-2 cursor-pointer uppercase tracking-tight"
          >
            ← Quay lại Vòng Quay & Thực Đơn
          </button>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`${editType === 'food' ? 'bg-[#EF476F]' : 'bg-[#118AB2]'} text-white text-[10px] font-black px-2.5 py-1 rounded-md border-2 border-[#2D3047] uppercase inline-block shadow-[1.5px_1.5px_0px_#2D3047]`}>
              {editType === 'food' ? '🍱 Địa điểm Ăn uống' : '☕ Quán Cà phê / Đồ uống'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2D3047] leading-tight font-serif">
            {editName || selectedDetailItem.name}
          </h2>
        </div>
      </div>

      {/* Content Grid */}
      <form id="edit-detail-food-form" onSubmit={handleSaveEditedItem} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side: Information fields */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047]">
            <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold">
              ✏️ THÔNG TIN TỔNG QUAN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Tên Quán Tủ / Tên món *
                </label>
                <input
                  id="edit-item-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs font-bold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Phân Loại Địa Điểm *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="edit-type-food"
                    type="button"
                    onClick={() => {
                      setEditType('food');
                      setEditCategory('Phở');
                      setCustomEditCategory('');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 border-[#2D3047] transition-all cursor-pointer text-center ${editType === 'food'
                        ? 'bg-[#EF476F] text-white shadow-[2px_2px_0px_#2D3047]'
                        : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    🍱 Đồ ăn
                  </button>
                  <button
                    id="edit-type-drink"
                    type="button"
                    onClick={() => {
                      setEditType('drink');
                      setEditCategory('Cà phê');
                      setCustomEditCategory('');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 border-[#2D3047] transition-all cursor-pointer text-center ${editType === 'drink'
                        ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_#2D3047]'
                        : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    🥤 Cà phê/Đồ uống
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Danh Mục Chi Tiết
                </label>
                <select
                  id="edit-item-category-select"
                  value={editCategory === 'custom_other' ? 'custom_other' : (([...foodCategories, ...drinkCategories].includes(editCategory)) ? editCategory : 'custom_other')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditCategory(val);
                    if (val !== 'custom_other') {
                      setCustomEditCategory('');
                    }
                  }}
                  className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                >
                  {(editType === 'food' ? foodCategories : drinkCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom_other">✍️ Nhập danh mục mới...</option>
                </select>
              </div>

              {(editCategory === 'custom_other' || (![...foodCategories, ...drinkCategories].includes(editCategory) && editCategory !== '')) && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-[#EF476F] uppercase tracking-widest block mb-1 font-extrabold animate-pulse">
                    ✏️ Tên danh mục tùy chọn mới *
                  </label>
                  <input
                    id="edit-item-custom-category"
                    type="text"
                    required
                    placeholder="Ví dụ: Đồ Hàn, Món cuốn, Trà hoa..."
                    value={editCategory === 'custom_other' ? customEditCategory : editCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editCategory === 'custom_other') {
                        setCustomEditCategory(val);
                      } else {
                        setEditCategory(val);
                      }
                    }}
                    className="w-full text-xs font-bold border-2 border-[#EF476F] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden placeholder-stone-400"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-[#2D3047] uppercase tracking-widest block mb-1 font-bold">
                  Phường Sát Nhập Cố Định *
                </label>
                <select
                  id="edit-item-ward"
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                >
                  {HANOI_MERGED_WARDS.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Địa Chỉ Cụ Thể (Số nhà, ngõ ngách)
                </label>
                <input
                  id="edit-item-address"
                  type="text"
                  placeholder="Ví dụ: Số 25 Hàng Khay"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                />
              </div>

              {/* Danh sách các chi nhánh/cơ sở */}
              <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047] md:col-span-2">
                <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold flex items-center justify-between">
                  <span>🏢 CÁC CƠ SỞ / CHI NHÁNH ({editBranches.length})</span>
                </h3>

                {/* Form thêm cơ sở mới */}
                <div className="bg-white border-2 border-[#2D3047] rounded-2xl p-4 mb-5 shadow-[2px_2px_0px_#2D3047] space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Tên Cơ Sở *
                      </label>
                      <input
                        id="input-new-branch-name"
                        type="text"
                        placeholder="Ví dụ: Cơ sở Tây Hồ, Cơ sở 2"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Địa Chỉ Cơ Sở *
                      </label>
                      <input
                        id="input-new-branch-address"
                        type="text"
                        placeholder="Ví dụ: Số 12 Hàng Bè, Hoàn Kiếm, Hà Nội"
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-add-branch-action"
                    type="button"
                    onClick={() => {
                      if (!newBranchName.trim() || !newBranchAddress.trim()) return;
                      const branchToAdd: Branch = {
                        id: 'br_' + Date.now(),
                        name: newBranchName.trim(),
                        address: newBranchAddress.trim()
                      };
                      setEditBranches(prev => [...prev, branchToAdd]);
                      setNewBranchName('');
                      setNewBranchAddress('');
                    }}
                    className="inline-flex items-center gap-1 bg-[#2D3047] hover:bg-stone-800 text-white font-bold p-2 px-4 rounded-xl text-[10px] uppercase cursor-pointer tracking-wider active:translate-y-0.5 select-none"
                  >
                    ➕ Thêm Cơ Sở
                  </button>
                </div>

                {/* Danh sách cơ sở hiện hữu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                  {editBranches.length > 0 ? (
                    editBranches.map((br) => (
                      <div
                        key={br.id}
                        className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4px_4px_0px_#2D3047] transition-all duration-150 flex flex-col gap-1.5 justify-between text-left"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-dashed border-stone-200 pb-1">
                          <span className="text-xs font-black text-[#2D3047]">{br.name}</span>
                          <button
                            type="button"
                            onClick={() => setEditBranches(prev => prev.filter(b => b.id !== br.id))}
                            className="text-red-500 hover:text-red-700 font-bold hover:scale-110 cursor-pointer p-0.5 rounded transition-all text-xs"
                            title="Xóa cơ sở này"
                          >
                            🗑️
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-600 font-bold leading-normal">📍 {br.address}</p>

                        <div className="flex justify-end pt-1">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(br.address)}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="text-[9px] font-black text-[#118AB2] hover:underline"
                          >
                            🗺️ Chỉ đường
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <p className="text-xs text-stone-400 italic font-medium">Chưa có chi nhánh cơ sở phụ nào được khai báo.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047] md:col-span-2">
                <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold flex items-center justify-between">
                  <span>⭐ ĐÁNH GIÁ CHẤT LƯỢNG QUÁN ({editReviews.length})</span>
                </h3>

                {/* Form viết đánh giá mới */}
                <div className="bg-white border-2 border-[#2D3047] rounded-2xl p-4 mb-5 shadow-[2px_2px_0px_#2D3047] space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                      Điểm Đánh Giá (Xếp hạng sao)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewReviewRating(s)}
                          className="text-2xl transition-all cursor-pointer hover:scale-110 active:scale-90 p-0.5"
                        >
                          {s <= newReviewRating ? '⭐' : '☆'}
                        </button>
                      ))}
                      <span className="text-xs font-black text-[#FF6B35] ml-2 font-mono">{newReviewRating}/5 Sao</span>
                    </div>
                  </div>

                  {/* Chọn nhanh tiêu chí trải nghiệm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl text-[11px] select-none text-left">
                    {/* Nhóm 1: Giá thành */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-600 block">💰 Giá thành:</span>
                      <div className="flex gap-1">
                        {['rẻ', 'vừa', 'đắt'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewPrice(val as any)}
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${reviewPrice === val
                                ? 'bg-[#EF476F] text-white border-[#EF476F] shadow-[1px_1px_0px_#2D3047]'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nhóm 2: Định lượng/Chất lượng suất ăn */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-600 block">🍽️ Định lượng:</span>
                      <div className="flex gap-1">
                        {['ít', 'no', 'nhiều'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewQuantity(val as any)}
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${reviewQuantity === val
                                ? 'bg-[#118AB2] text-white border-[#118AB2] shadow-[1px_1px_0px_#2D3047]'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nhóm 3: Vệ sinh */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-600 block">✨ Vệ sinh:</span>
                      <div className="flex gap-1">
                        {['sạch sẽ', 'bẩn'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewHygiene(val as any)}
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${reviewHygiene === val
                                ? 'bg-[#06D6A0] text-[#2D3047] border-[#06D6A0] shadow-[1px_1px_0px_#2D3047]'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nhóm 4: Không gian */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-600 block">🏡 Không gian:</span>
                      <div className="flex gap-1">
                        {['rộng rãi - thoáng mát', 'chật chội - nóng nực'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewSpace(val as any)}
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${reviewSpace === val
                                ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[1px_1px_0px_#2D3047]'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                              }`}
                          >
                            {val === 'rộng rãi - thoáng mát' ? 'rộng' : 'chật'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nhóm 5: Chỗ để xe */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-600 block">🏍️ Chỗ để xe:</span>
                      <div className="flex gap-1">
                        {['có', 'không'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewParking(val as any)}
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${reviewParking === val
                                ? 'bg-[#2D3047] text-white border-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                      Ghi Chú Trải Nghiệm Thêm (Có thể điền thêm hoặc để trống)
                    </label>
                    <textarea
                      id="form-review-comment"
                      rows={2}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Ví dụ: Đồ uống siêu đậm vị, không gian rộng rãi trang trí cổ kính... (Hoặc để trống nếu chỉ muốn lưu các tiêu chí chọn nhanh ở trên)"
                      className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden resize-none"
                    />
                  </div>

                  <button
                    id="btn-add-review-action"
                    type="button"
                    onClick={() => {
                      const tags = `[Giá: ${reviewPrice} • Suất ăn: ${reviewQuantity} • Vệ sinh: ${reviewHygiene} • Không gian: ${reviewSpace} • Để xe: ${reviewParking}]`;
                      const commentText = newReviewComment.trim();
                      const finalComment = commentText ? `${tags}\n${commentText}` : tags;

                      const reviewToAdd: Review = {
                        id: 'rev_' + Date.now(),
                        rating: newReviewRating,
                        comment: finalComment,
                        createdAt: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      };
                      setEditReviews(prev => [reviewToAdd, ...prev]);

                      setNewReviewComment('');
                      setNewReviewRating(5);

                      // Reset về mặc định
                      setReviewPrice('vừa');
                      setReviewQuantity('no');
                      setReviewHygiene('sạch sẽ');
                      setReviewSpace('rộng rãi - thoáng mát');
                      setReviewParking('có');
                    }}
                    className="inline-flex items-center gap-1 bg-[#2D3047] hover:bg-stone-800 text-white font-bold p-2 px-4 rounded-xl text-[10px] uppercase cursor-pointer tracking-wider active:translate-y-0.5 select-none"
                  >
                    ➕ Thêm Đánh Giá
                  </button>
                </div>

                {/* Danh sách các đánh giá cũ */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {editReviews.length > 0 ? (
                    editReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4px_4px_0px_#2D3047] transition-all duration-150 flex flex-col gap-2 justify-between"
                      >
                        <div className="flex items-center justify-between text-[10px] font-black text-stone-500 border-b border-dashed border-stone-200 pb-1.5">
                          <span className="text-[#FF6B35]">
                            {"⭐".repeat(rev.rating)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span>{rev.createdAt}</span>
                            <button
                              type="button"
                              onClick={() => setEditReviews(prev => prev.filter(r => r.id !== rev.id))}
                              className="text-red-500 hover:text-red-700 font-bold hover:scale-110 cursor-pointer p-0.5 rounded transition-all"
                              title="Xóa đánh giá này"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-stone-700 font-medium leading-relaxed font-sans whitespace-pre-wrap">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <p className="text-xs text-stone-400 italic font-medium">Chưa có đánh giá nào cho quán này. Hãy thêm đánh giá đầu tiên ở phía trên nhé!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-stone-100">
                <button
                  id="btn-cancel-edit-bottom"
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="bg-white hover:bg-stone-50 text-[#2D3047] font-black px-5 py-2.5 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-edit-bottom"
                  type="submit"
                  className="bg-[#06D6A0] hover:bg-[#12dda7] text-[#2D3047] font-black px-6 py-2.5 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer text-center font-bold"
                >
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: weather criteria & Maps shortcut view */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047]">
            <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold">
              🌦️ NHÀ KHÍ TƯỢNG HỌC
            </h3>
            <p className="text-[11px] text-stone-500 mb-3 font-semibold leading-relaxed">
              Chọn các trạng thái thời tiết phù hợp để Trợ lý ẩm thực AI dễ dàng đề xuất:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'hot', label: '🔥 Nóng' },
                { val: 'cold', label: '❄️ Lạnh' },
                { val: 'cool', label: '🍃 Mát' }
              ].map((item) => {
                const isSelected = editBestWeather.includes(item.val);
                return (
                  <button
                    id={`btn-edit-weather-${item.val}`}
                    type="button"
                    key={item.val}
                    onClick={() => {
                      setEditBestWeather(prev =>
                        prev.includes(item.val)
                          ? prev.filter(v => v !== item.val)
                          : [...prev, item.val]
                      );
                    }}
                    className={`text-xs font-black p-2 rounded-xl border-2 border-[#2D3047] transition-all cursor-pointer text-center flex flex-col justify-center items-center gap-1 ${
                      isSelected
                        ? 'bg-[#FFD166] text-[#2D3047] shadow-[2px_2px_0px_#2D3047]'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 font-bold'
                    }`}
                  >
                    <span className="text-sm">{item.label.split(' ')[0]}</span>
                    <span className="text-[10px] uppercase font-bold">{item.label.split(' ')[1]}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#2D3047] stroke-[3.5] mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FFFBF5] border-4 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047] text-[#2D3047] flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-bold">
              🗺️ Google Bản Đồ Lối Tắt
            </h3>
            <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">
              Liên kết trực tiếp tới ứng dụng Google Maps tìm kiếm tên quán giúp bạn tra cứu nhanh thông tin khác.
            </p>

            <a
              id="btn-edit-maps-search"
              href={getGoogleMapsSearchUrl(editName || selectedDetailItem.name, editAddress, editWard)}
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full bg-[#118AB2] hover:bg-[#159ecb] text-white font-black py-3 rounded-xl uppercase text-xs border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] cursor-pointer inline-flex items-center justify-center gap-1.5 text-center active:translate-y-0.5 no-underline"
            >
              🗺️ Tra cứu trên Google Maps
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
