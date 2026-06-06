import React from 'react';
import { UtensilsCrossed, Sparkles, History } from 'lucide-react';
import { WeatherInfo } from '../types';
import { getWeatherConditionLabel } from '../data';

interface HeaderProps {
  weather: WeatherInfo;
  isWeatherLoading: boolean;
  fetchLiveWeather: () => Promise<void>;
}

export default function Header({ weather, isWeatherLoading, fetchLiveWeather }: HeaderProps) {
  return (
    <header id="hanoi-header" className="bg-white border-b-4 border-[#FF6B35] flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 md:px-8 md:py-4 shrink-0 gap-3 md:gap-4 mb-6 shadow-xs">
      <div className="flex flex-col w-full sm:w-auto text-left gap-1">
        {/* Hàng 1: Icon Dao Nĩa + Tiêu đề LAMBOM WHEEL */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-11 md:h-11 bg-[#FF6B35] rounded-xl flex items-center justify-center border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] md:shadow-[3px_3px_0px_#2D3047] shrink-0">
            <UtensilsCrossed className="w-5 h-5 md:w-6.5 md:h-6.5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#2D3047] uppercase tracking-tight leading-none">
            LAMBOM WHEEL
          </h1>
        </div>

        {/* Hàng 2: Vòng quay chọn món cho người OVTK */}
        <p className="text-[9.5px] md:text-xs font-bold text-[#FF6B35] uppercase tracking-widest flex items-center gap-1 leading-none mt-1 pl-0.5">
          <Sparkles className="w-3.5 h-3.5 fill-[#FF6B35]/20 animate-pulse shrink-0" />
          Vòng quay chọn món cho người OVTK
        </p>
      </div>

      {/* Header Live Weather Display Badge */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
        <div className="bg-[#E1F2FE] border-2 border-[#118AB2] rounded-full px-4 py-1.5 md:px-5 md:py-2 flex items-center gap-2.5 md:gap-3 shadow-[2.5px_2.5px_0px_#118AB2] md:shadow-[3px_3px_0px_#118AB2]">
          <span className="text-xl md:text-2xl animate-bounce">
            {weather.condition === 'hot' && '🔥'}
            {weather.condition === 'sunny' && '☀️'}
            {weather.condition === 'cold' && '❄️'}
            {weather.condition === 'rainy' && '🌧️'}
            {weather.condition === 'cool' && '🍃'}
            {weather.condition === 'windy' && '💨'}
            {weather.condition === 'humid' && '🌫️'}
          </span>
          <div className="text-left">
            <p className="text-[8.5px] md:text-[10px] font-bold text-[#118AB2] uppercase tracking-wider leading-none mb-0.5">Thời tiết hiện tại</p>
            <p className="text-xs md:text-sm font-black text-[#2D3047] leading-tight">
              {weather.temp}°C • {getWeatherConditionLabel(weather.condition)}
            </p>
          </div>
        </div>

        <button
          id="btn-re-sync-weather"
          title="Đồng bộ lại thời tiết"
          type="button"
          onClick={fetchLiveWeather}
          className="p-2 md:p-2.5 bg-white border-2 border-[#2D3047] hover:bg-[#FFF9F2] rounded-full shadow-[2px_2px_0px_#2D3047] cursor-pointer shrink-0 animate-fade-in"
        >
          <History className={`w-3.5 h-3.5 md:w-4 md:h-4 text-[#2D3047] ${isWeatherLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
