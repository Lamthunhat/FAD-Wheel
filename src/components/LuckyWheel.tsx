/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { WheelItem } from '../types';

interface LuckyWheelProps {
  items: WheelItem[];
  onSpinEnd: (item: WheelItem) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

const PALETTE_COLORS = [
  '#EF476F', // Retro Pink
  '#FFD166', // Butter Yellow
  '#06D6A0', // Teal/Green
  '#118AB2', // Ocean Blue
  '#FF6B35', // Warm Tangerine
  '#073B4C'  // Navy Slate
];

export default function LuckyWheel({
  items,
  onSpinEnd,
  isSpinning,
  setIsSpinning
}: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const [tickerOffset, setTickerOffset] = useState(0);

  // Default item if list is empty
  const activeItems = items.length > 0 ? items : [
    { id: 'empty', name: 'Thêm địa điểm đi bạn!', type: 'food', location: { ward: '', district: '' }, description: '', priceRange: '', bestWeather: [], recommendationReason: '' }
  ] as WheelItem[];

  // Render the static/dynamic canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, width, height);

    const len = activeItems.length;
    const sliceAngle = (Math.PI * 2) / len;

    // Draw slices
    for (let i = 0; i < len; i++) {
      const item = activeItems[i];
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate retro theme colors
      ctx.fillStyle = PALETTE_COLORS[i % PALETTE_COLORS.length];
      ctx.fill();

      // Slice border (Thick Slate Border)
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2D3047';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2D3047';
      
      // Select appropriate contrast text color for dark slices
      const isDarkColor = PALETTE_COLORS[i % PALETTE_COLORS.length] === '#073B4C' || PALETTE_COLORS[i % PALETTE_COLORS.length] === '#118AB2';
      ctx.fillStyle = isDarkColor ? '#FFFFFF' : '#2D3047';
      
      ctx.font = '900 13px "Inter", sans-serif';

      const maxTextWidth = radius * 0.75;
      let text = item.name;
      if (ctx.measureText(text).width > maxTextWidth) {
        text = text.substring(0, 16) + '...';
      }

      ctx.fillText(text.toUpperCase(), radius - 24, 0);
      ctx.restore();
    }

    // Outer thick vintage ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2D3047';
    ctx.stroke();

    // Inside decorative tiny dots
    for (let i = 0; i < len * 2; i++) {
      const dotAngle = angle + i * (sliceAngle / 2);
      const dotX = cx + (radius - 12) * Math.cos(dotAngle);
      const dotY = cy + (radius - 12) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#2D3047';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    // Center Hub (Vintage circle with a pop button)
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#2D3047';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(45, 48, 71, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B35';
    ctx.strokeStyle = '#2D3047';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
  };

  // Sync initial render of the wheel
  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [items]);

  // Handle spin anim loop
  const spinTick = () => {
    if (velocityRef.current > 0.001) {
      rotationRef.current += velocityRef.current;
      // Decay velocity (friction)
      velocityRef.current *= 0.982; 

      // Give a retro tactile ticker wiggle effect when crossing items
      const len = activeItems.length;
      const sliceAngle = (Math.PI * 2) / len;
      const currentTickValue = Math.floor(rotationRef.current / sliceAngle);
      setTickerOffset(Math.sin(rotationRef.current * len) * 4);

      drawWheel(rotationRef.current);
      animationFrameRef.current = requestAnimationFrame(spinTick);
    } else {
      // Spinning finished
      setIsSpinning(false);
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Calculate winning item
      // The pointer is at the very top (angle: -90 degrees, i.e. 3/2 * PI)
      const len = activeItems.length;
      const sliceAngle = (Math.PI * 2) / len;

      // Wrap rotation to [0, 2PI)
      const normalizedRotation = (Math.PI * 2 - (rotationRef.current % (Math.PI * 2))) % (Math.PI * 2);
      
      // Top pointer is at (Math.PI * 1.5) index relative to the polar angle
      // Offset by -90 deg (270 deg)
      const pointerAngle = (Math.PI * 1.5) % (Math.PI * 2);
      
      // Calculating exact slice index
      let winningIndex = Math.floor((normalizedRotation + Math.PI * 1.5) / sliceAngle) % len;
      if (winningIndex < 0) {
        winningIndex += len;
      }
      
      onSpinEnd(activeItems[winningIndex]);
    }
  };

  const startSpin = () => {
    if (isSpinning || activeItems.length === 0) return;

    // Reset rotation a bit or accumulate
    setIsSpinning(true);
    
    // Set high starting velocity
    // Random spin force between 0.35 and 0.55 rad per frame
    velocityRef.current = 0.35 + Math.random() * 0.25; 
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(spinTick);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative select-none">
        
        {/* Retro pointer/arrow centered at the top pointing down */}
        <div 
          id="wheel-pointer"
          style={{ transform: `translateX(-50%) translateY(${tickerOffset}px)` }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-12 h-12 text-[#FF6B35] drop-shadow-[4px_4px_0px_#2D3047] transition-transform duration-75 cursor-pointer"
          onClick={startSpin}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21l-10-16h20z" stroke="#2D3047" strokeWidth="2" strokeLinejoin="miter"/>
          </svg>
        </div>

        {/* Dynamic canvas wheel container */}
        <div className="rounded-full bg-white p-2 border-4 border-[#2D3047] shadow-[10px_10px_0px_#2D3047]">
          <canvas
            id="food-wheel-canvas"
            ref={canvasRef}
            width={380}
            height={380}
            className="rounded-full max-w-full block"
          />
        </div>
      </div>

      {/* Retro bold spin button */}
      <button
        id="btn-spin-wheel"
        onClick={startSpin}
        disabled={isSpinning || items.length === 0}
        className="mt-8 bg-[#FF6B35] hover:bg-[#ff8052] disabled:bg-stone-300 text-white px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest border-4 border-[#2D3047] shadow-[6px_6px_0px_#2D3047] hover:translate-y-0.5 hover:shadow-[4px_4px_0px_#2D3047] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:transform-none disabled:shadow-none"
      >
        {isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}
      </button>
    </div>
  );
}
