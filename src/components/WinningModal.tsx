import React from 'react';
import { X, MapPin } from 'lucide-react';
import { WheelItem } from '../types';
import { getGoogleMapsSearchUrl } from '../data';

interface WinningModalProps {
  showWinModal: boolean;
  setShowWinModal: (show: boolean) => void;
  winningItem: WheelItem | null;
  setIsSpinning: (spinning: boolean) => void;
}

export default function WinningModal({
  showWinModal,
  setShowWinModal,
  winningItem,
  setIsSpinning
}: WinningModalProps) {
  if (!showWinModal || !winningItem) return null;

  return (
    <div id="win-celebration-modal" className="fixed inset-0 bg-[#2D3047]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#FFF9F2] border-4 border-[#2D3047] rounded-[36px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_#2D3047] relative overflow-hidden animate-float">

        {/* Top Close button */}
        <button
          id="btn-close-win-modal"
          type="button"
          onClick={() => setShowWinModal(false)}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-[#2D3047] hover:bg-stone-100 rounded-full cursor-pointer shadow-[2px_2px_0px_#2D3047] transition-all"
        >
          <X className="w-4 h-4 text-[#2D3047]" />
        </button>

        {/* Vintage Ribbon Header Banner */}
        <div className="text-center mb-6">
          <span className="text-sm font-black text-[#FF6B35] uppercase tracking-widest block mb-1">🎉 Chúc mừng bạn đã trúng!</span>
          <div className="inline-block bg-[#FFD166] text-[#2D3047] font-black border-4 border-[#2D3047] px-8 py-2.5 rounded-2xl shadow-[4px_4px_0px_#2D3047] uppercase text-xl md:text-2xl tracking-wide rotate-2">
            Hôm nay chén món này!
          </div>
        </div>

        <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 mb-5 shadow-[4px_4px_0px_#2D3047] space-y-4">
          <div>
            <span className="text-[10px] bg-[#EF476F] text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {winningItem.type === 'food' ? '🍱 Đồ Ăn Hà Nội' : '☕ Đồ uống/Quán Cà phê'}
            </span>
            <h3 className="text-2xl font-black text-[#2D3047] leading-tight mt-2.5 font-serif">
              {winningItem.name}
            </h3>
          </div>

          {/* Address details */}
          <div className="space-y-4 py-1 text-sm text-stone-700">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-[#EF476F] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-stone-800">Địa chỉ:</p>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  {winningItem.location.addressDetail ? `${winningItem.location.addressDetail}, ` : ''}
                  {winningItem.location.ward}, Hà Nội
                </p>

                {/* Google Maps Shortcut Link */}
                <a
                  id="link-google-maps"
                  href={getGoogleMapsSearchUrl(winningItem.name, winningItem.location.addressDetail, winningItem.location.ward)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-white bg-[#118AB2] hover:bg-[#159ecb] border-2 border-[#2D3047] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2D3047] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D3047] transition-all no-underline shrink-0"
                >
                  🗺️ Chỉ đường Google Maps
                </a>
              </div>
            </div>

            {winningItem.branches && winningItem.branches.length > 0 && (
              <div className="space-y-1.5 border-t border-dashed border-[#2D3047]/15 pt-3 text-left">
                <span className="text-[10px] font-black text-[#118AB2] uppercase tracking-widest block">
                  🏢 Các cơ sở khác của quán ({winningItem.branches.length}):
                </span>
                <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 hover:overscroll-contain">
                  {winningItem.branches.map((br) => (
                    <div key={br.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 p-2 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-stone-800 block text-[11px]">{br.name}</span>
                        <span className="text-stone-500 block text-[10px] mt-0.5 font-medium">📍 {br.address}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(br.address)}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-[10px] font-extrabold text-[#118AB2] hover:underline whitespace-nowrap ml-2 shrink-0 bg-white border border-stone-300 px-1.5 py-0.5 rounded-md shadow-[1px_1px_0px_#2D3047] no-underline"
                      >
                        🗺️ Bản đồ
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {winningItem.reviews && winningItem.reviews.length > 0 ? (
              <div className="space-y-2 border-t border-dashed border-[#2D3047]/15 pt-3">
                <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest block mb-1">
                  ⭐ Đánh giá nổi bật ({winningItem.reviews.length} đánh giá):
                </span>
                <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                  {winningItem.reviews.map((rev) => (
                    <div key={rev.id} className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-xl p-2.5 shadow-[2px_2px_0px_#2D3047] text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mb-1">
                        <span>{"⭐".repeat(rev.rating)}</span>
                        <span>{rev.createdAt}</span>
                      </div>
                      <p className="font-medium text-stone-700 leading-normal whitespace-pre-wrap">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t border-dashed border-[#2D3047]/15 pt-3">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-0.5">
                  Đánh giá:
                </span>
                <p className="text-xs text-stone-400 italic">Chưa có đánh giá nào cho quán này. Kính mời bạn vào trang Chi tiết để thêm nhận xét nhé!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            id="btn-spin-again"
            type="button"
            onClick={() => {
              setShowWinModal(false);
              setIsSpinning(true);
              // Trigger programmatic click spinner in background
              const spinButton = document.getElementById('btn-spin-wheel');
              if (spinButton) spinButton.click();
            }}
            className="bg-white hover:bg-stone-100 text-[#2D3047] font-black py-3 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[4px_4px_0px_#2D3047] cursor-pointer"
          >
            🔄 Không ưng, quay lại
          </button>
          <button
            id="btn-accept-win"
            type="button"
            onClick={() => setShowWinModal(false)}
            className="bg-[#06D6A0] hover:bg-[#12dda7] text-[#2D3047] font-black py-3 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[4px_4px_0px_#2D3047] cursor-pointer"
          >
            💚 Đi thôi, xuất phát!
          </button>
        </div>

      </div>
    </div>
  );
}
