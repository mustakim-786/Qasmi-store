import { useRef, useState } from 'react';
import { Play, X, Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { getCloudinaryPoster, getOptimizedVideoUrl } from '@/lib/cloudinary';

export function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl) return null;

  const isYoutube = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);

  if (isYoutube) {
    const embedUrl = `https://www.youtube.com/embed/${isYoutube[1]}?rel=0&autoplay=1`;
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-deep shadow-card">
        {playing ? (
          <div className="relative aspect-video">
            <iframe
              src={embedUrl}
              title="Product video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="absolute top-3 end-3 z-10 rounded-full bg-white/80 p-2 text-deep shadow-soft transition-all hover:bg-white"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative flex aspect-square w-full items-center justify-center sm:aspect-video"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-500 opacity-90" />
            <div className="group relative z-10 flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all group-hover:scale-110 group-active:scale-95">
                <Play className="h-7 w-7 fill-white text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">
                {t('Watch Product Video', 'مصنوعہ ویڈیو دیکھیں')}
              </span>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Cloudinary or direct video — optimized for near-instant playback
  const optimizedUrl = getOptimizedVideoUrl(videoUrl);
  const posterUrl = getCloudinaryPoster(videoUrl);

  const handlePlay = () => {
    setPlaying(true);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-deep shadow-card">
      {playing ? (
        <div className="relative">
          <video
            ref={videoRef}
            src={optimizedUrl}
            poster={posterUrl || undefined}
            controls
            autoPlay
            playsInline
            onCanPlay={() => setReady(true)}
            onLoadedData={() => setReady(true)}
            className="aspect-square w-full bg-black object-contain sm:aspect-video"
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-deep/80">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => { setPlaying(false); setReady(false); }}
            className="absolute top-3 end-3 z-10 rounded-full bg-white/80 p-2 text-deep shadow-soft transition-all hover:bg-white"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden sm:aspect-video"
        >
          {/* Use poster image instead of preloading the full video —
              prevents 1000 simultaneous video downloads under load */}
          {posterUrl ? (
            <img
              src={posterUrl}
              alt="Product video thumbnail"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          ) : (
            <video
              src={optimizedUrl}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-deep/60 to-brand-900/40" />
          <div className="group relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all group-hover:scale-110 group-active:scale-95">
              <Play className="h-7 w-7 fill-white text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">
              {t('Watch Product Video', 'مصنوعہ ویڈیو دیکھیں')}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
