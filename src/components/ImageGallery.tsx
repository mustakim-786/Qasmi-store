import { useRef, useState, useEffect } from 'react';

export function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement;
    if (child) {
      container.scrollTo({ left: child.offsetLeft - container.offsetLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0 });
    }
  }, [images]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const childWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / childWidth);
    setActiveIndex(newIndex);
  };

  if (images.length === 0) return null;

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x-mandatory touch-pan-x overflow-x-auto"
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="snap-center w-full flex-shrink-0"
          >
            <div className="aspect-square overflow-hidden bg-brand-50">
              <img
                src={img}
                alt={`${alt} - ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? 'w-6 bg-brand-500' : 'w-2 bg-brand-200'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
