import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';

export interface MediaItem {
  type: 'video' | 'image';
  url: string;
}

export function MediaGallery({
  items,
  alt,
}: {
  items: MediaItem[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const isSwiping = useRef(false);

  const maxIndex = items.length - 1;

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setActiveIndex(clamped);
  }, [items.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(touchDeltaX.current) > Math.abs(touchDeltaY.current) && Math.abs(touchDeltaX.current) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (isSwiping.current && Math.abs(touchDeltaX.current) > threshold) {
      if (touchDeltaX.current < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
    isSwiping.current = false;
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      <div className="relative select-none">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="overflow-hidden rounded-2xl"
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {items.map((item, i) => (
              <div key={i} className="w-full flex-shrink-0">
                {item.type === 'video' ? (
                  <VideoPlayer videoUrl={item.url} />
                ) : (
                  <div className="aspect-square overflow-hidden bg-brand-50">
                    <img
                      src={item.url}
                      alt={`${alt} - ${i}`}
                      width={600}
                      height={600}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow controls */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="absolute start-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-500 shadow-lift backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex === maxIndex}
              className="absolute end-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-500 shadow-lift backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`flex h-2.5 items-center justify-center rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-brand-500' : 'w-2.5 bg-brand-200'
              }`}
              aria-label={`Go to ${item.type === 'video' ? 'video' : 'image'} ${i + 1}`}
            >
              {i === activeIndex && item.type === 'video' && <Video className="h-2 w-2 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
