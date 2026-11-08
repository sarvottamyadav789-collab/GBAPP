import React, { useState, useEffect, useRef } from 'react';
import { CarouselSlide } from '../types.ts';

interface CarouselProps {
  slides: CarouselSlide[];
  onSlideClick?: (slide: CarouselSlide) => void;
}

export const Carousel: React.FC<CarouselProps> = ({ slides, onSlideClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [slides.length]);

  // Reset index if slides change and index is out of bounds
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || slides.length <= 1) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
    if (distance < -50) {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (slides.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Carousel Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full relative overflow-hidden rounded-[24px] bg-[#0d121d] border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.6)] aspect-[16/9] sm:aspect-[16/8.5] cursor-pointer"
        onClick={() => onSlideClick?.(slides[currentIndex])}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className="w-full h-full shrink-0 relative flex items-end overflow-hidden"
            >
              <img
                src={slide.image}
                alt={slide.title}
                loading="eager"
                decoding="sync"
                className="absolute inset-0 w-full h-full object-cover select-none"
                style={{
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/banner_study.png';
                }}
              />

              {/* Subtle small corner badge only if a title exists, without blocking the banner artwork */}
              {slide.title && slide.title.trim() && (
                <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-bold tracking-wide shadow-md">
                    {slide.title}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-300 cursor-pointer ${
                currentIndex === i
                  ? 'w-7 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]'
                  : 'w-2 h-2 rounded-full bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
