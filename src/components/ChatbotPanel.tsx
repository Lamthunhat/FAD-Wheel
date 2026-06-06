import React from 'react';
import { Sparkles, Send } from 'lucide-react';
import { WeatherInfo, WheelItem } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  recommendedItemIds?: string[];
}

interface ChatbotPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  handleSendChatMessage: () => Promise<void>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setAiResult: (res: any) => void;
  weather: WeatherInfo;
  items: WheelItem[];
  setSelectedDetailItem: (item: WheelItem | null) => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  aiResult: any;
}

export default function ChatbotPanel({
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  handleSendChatMessage,
  setChatMessages,
  setAiResult,
  weather,
  items,
  setSelectedDetailItem,
  chatContainerRef,
  aiResult
}: ChatbotPanelProps) {

  const renderTextWithBolds = (text: string) => {
    if (!text) return "";
    const parts = text.split(/\n/);
    return parts.map((line, lineIdx) => {
      const boldParts = line.split(/\*\*/);
      return (
        <div key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
          {boldParts.map((part, partIdx) => {
            if (partIdx % 2 === 1) {
              return <strong key={partIdx} className="font-extrabold text-[#FFD166]">{part}</strong>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <div className="bg-[#073B4C] border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047] text-white relative flex flex-col min-h-[460px]">
      <div className="absolute -top-3.5 -right-2 bg-[#FFD166] text-[#2D3047] font-black px-3 py-0.5 rounded-lg text-[9px] uppercase tracking-wider border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] flex items-center gap-0.5 z-10 animate-pulse">
        <Sparkles className="w-2.5 h-2.5 fill-amber-300" /> Chatbot AI
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-black flex items-center gap-1.5 uppercase tracking-wide">
          💬 Thư ký Tú Béo
        </h2>
        {chatMessages.length > 1 && (
          <button
            id="btn-reset-chat"
            type="button"
            onClick={(e) => {
              // 1. Chặn hành vi mặc định của thẻ button trong form/layout
              e.preventDefault();

              if (confirm("Bạn muốn bắt đầu cuộc hội thoại mới cùng thư ký Tú béo chứ?")) {
                // 2. Chủ động đưa khung chat về đầu trang trước khi làm mới dữ liệu
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = 0;
                }

                setChatMessages([
                  {
                    id: 'welcome',
                    sender: 'bot',
                    text: 'Xin chào! Mình là Tú béo đây. 🍜 Cuộc hội thoại đã được làm mới, hôm nay bạn muốn tìm quán ăn hay đồ uống gì nào?',
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
                setAiResult(null);
              }
            }}
            className="text-[9px] text-[#FFD166] hover:underline font-extrabold uppercase border border-[#FFD166]/20 bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          >
            Làm mới
          </button>
        )}
      </div>

      {/* Current live weather brief bar - Fixed wrapping & alignment */}
      {weather && (
        <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10 mb-3 flex items-center justify-between gap-2.5 text-[11px] text-blue-100 font-medium select-none">
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span>🌐 Hà Nội:</span>
            <strong className="text-white font-black">{weather.temp}°C</strong>
          </div>
          <div className="truncate text-right italic text-blue-200 text-[10px] flex-1">
            {weather.description.replace('Bản tin thực tế: ', '')}
          </div>
        </div>
      )}

      {/* Interactive Message Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 bg-stone-950/20 border-2 border-[#2D3047] rounded-2xl p-3 overflow-y-auto max-h-[300px] min-h-[220px] lg:max-h-[450px] lg:min-h-[380px] scrollbar-thin scrollbar-thumb-white/10 flex flex-col gap-3.5"
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 max-w-[85%] ${
              msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold text-stone-300 uppercase tracking-wider opacity-60">
                {msg.sender === 'user' ? '👤 Bạn' : '✨ Thư Ký Tú Béo'} • {msg.timestamp}
              </span>
            </div>

            <div
              className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed break-words font-medium select-text ${
                msg.sender === 'user'
                  ? 'bg-[#118AB2] text-white rounded-tr-none border border-[#118AB2]/20 shadow-[1px_2px_0px_rgba(0,0,0,0.15)]'
                  : 'bg-white/10 text-stone-100 rounded-tl-none border border-white/5 shadow-[1px_2px_0px_rgba(0,0,0,0.15)]'
              }`}
            >
              {renderTextWithBolds(msg.text)}

              {/* Integrated custom place recommendations */}
              {msg.sender === 'bot' && msg.recommendedItemIds && msg.recommendedItemIds.length > 0 && (
                <div className="mt-3 border-t border-dashed border-white/15 pt-2 whitespace-normal text-left">
                  <p className="text-[9px] text-[#FFD166] font-black uppercase tracking-wider mb-1.5 flex items-center gap-0.5">
                    📍 Quán tủ được gợi ý ({msg.recommendedItemIds.length}):
                  </p>
                  <div className="flex flex-col gap-1 w-full">
                    {items
                      .filter((it) => msg.recommendedItemIds?.includes(it.id))
                      .map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setSelectedDetailItem(it)}
                          className="w-full text-left font-bold text-stone-800 bg-stone-50 hover:bg-white text-[10px] p-1.5 rounded-lg border border-stone-200 transition-all flex items-center justify-between shadow-[1px_1px_0px_#2D3047] active:transform-none cursor-pointer"
                        >
                          <span className="truncate pr-1">
                            🍜 {it.name}{' '}
                            <span className="text-stone-500 font-medium text-[8px] block">
                              📍 Phường {it.location.ward}
                            </span>
                          </span>
                          <span className="text-[8px] font-black uppercase text-[#118AB2] shrink-0 bg-[#EBF7FF] px-1 py-0.5 rounded whitespace-nowrap">
                            Xem 📝
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="self-start flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-2 rounded-2xl rounded-tl-none">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce delay-200"></div>
            </div>
            <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest text-left">
              Đang suy ngẫm...
            </span>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestion Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        <button
          disabled={isChatLoading}
          type="button"
          onClick={() => {
            setChatInput('Hôm nay thời tiết Hà Nội khá nóng bức, tôi muốn ăn gì đó mát mẻ tủ nhà');
          }}
          className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          🌞 Trời nóng ăn gì?
        </button>
        <button
          disabled={isChatLoading}
          type="button"
          onClick={() => {
            setChatInput('Bảo mình vài quán ăn ấm áp thích hợp hôm mưa lạnh rét mướt');
          }}
          className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          🌧️ Phù hợp mưa rét
        </button>
        <button
          disabled={isChatLoading}
          type="button"
          onClick={() => {
            setChatInput('Tâm sự bún chả Obama xem có cơ sở nào khác không');
          }}
          className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          🍖 Thèm Bún Chả tủ
        </button>
      </div>

      {/* Message input panel */}
      <div className="mt-3 flex gap-2 border-t border-dashed border-white/15 pt-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendChatMessage();
            }
          }}
          disabled={isChatLoading}
          placeholder={isChatLoading ? 'Đang soạn câu trả lời...' : 'Hỏi món nước hợp thời tiết...'}
          className="flex-1 text-xs px-3 py-2 bg-stone-900 border-2 border-[#2D3047] rounded-xl text-white placeholder-stone-400 focus:outline-hidden focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166]/20 disabled:opacity-50 font-bold"
        />
        <button
          id="btn-chatbot-send"
          type="button"
          onClick={handleSendChatMessage}
          disabled={isChatLoading || !chatInput.trim()}
          className="bg-[#FFD166] hover:bg-[#ffe094] disabled:bg-stone-600 disabled:text-stone-400 text-[#2D3047] font-black px-3 py-2 rounded-xl text-xs uppercase border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] transition-all cursor-pointer flex items-center justify-center disabled:transform-none disabled:shadow-none shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter coupling switch indication */}
      {aiResult && aiResult.suggestedItems && aiResult.suggestedItems.length > 0 && (
        <div className="mt-2.5 bg-[#06D6A0]/10 border border-[#06D6A0]/20 p-2 rounded-xl flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-[#06D6A0] font-black">
            🎯 Đã lọc {aiResult.suggestedItems.length} gợi ý AI của Tú béo
          </span>
          <button
            type="button"
            onClick={() => setAiResult(null)}
            className="text-[9px] text-[#EF476F] font-black hover:underline cursor-pointer border-none bg-transparent"
          >
            Hủy lọc
          </button>
        </div>
      )}
    </div>
  );
}
