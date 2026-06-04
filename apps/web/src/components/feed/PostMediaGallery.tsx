import { MouseEventHandler, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

interface PostMediaGalleryProps {
  media: Array<{
    id: string;
    url: string;
    type?: string;
    mimeType?: string | null;
  }>;
}

function MediaTile({
  item,
  className,
  onClick,
}: {
  item: PostMediaGalleryProps['media'][number];
  className: string;
  onClick?: MouseEventHandler<HTMLImageElement | HTMLVideoElement>;
}) {
  const isVideo = item.type === 'VIDEO' || item.mimeType?.startsWith('video/');

  if (isVideo) {
    return (
      <video
        src={item.url}
        controls
        playsInline
        preload="metadata"
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />
    );
  }

  return <img src={item.url} alt="" className={className} onClick={onClick} />;
}

function clampIndex(index: number, total: number) {
  if (!total) return 0;
  if (index < 0) return total - 1;
  if (index >= total) return 0;
  return index;
}

export function PostMediaGallery({ media }: PostMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const activeItem = media[activeIndex];
  const hasMultiple = media.length > 1;

  const counterLabel = useMemo(
    () => `${activeIndex + 1} / ${media.length}`,
    [activeIndex, media.length],
  );

  const goToPrevious = () => setActiveIndex((current) => clampIndex(current - 1, media.length));
  const goToNext = () => setActiveIndex((current) => clampIndex(current + 1, media.length));

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, media.length));
  }, [media.length]);

  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewerOpen(false);
      }

      if (event.key === 'ArrowLeft') {
        goToPrevious();
      }

      if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewerOpen, media.length]);

  if (!media.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="group relative overflow-hidden bg-ink/5 dark:bg-white/5">
        <div
          className="w-full cursor-zoom-in"
          role="button"
          tabIndex={0}
          aria-label="Abrir midia do post"
          onClick={() => setIsViewerOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsViewerOpen(true);
            }
          }}
        >
          <MediaTile item={activeItem} className="max-h-[32rem] w-full object-cover" />
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Midia anterior"
              className="glass absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink transition hover:scale-110"
              onClick={goToPrevious}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Proxima midia"
              className="glass absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink transition hover:scale-110"
              onClick={goToNext}
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-bold text-surface">
              <Images size={13} />
              {counterLabel}
            </div>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="flex items-center justify-center gap-1.5">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir para midia ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-coral' : 'w-1.5 bg-line hover:bg-mute'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}

      {isViewerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-3 py-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsViewerOpen(false)}
        >
          <button
            type="button"
            aria-label="Fechar visualizacao"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setIsViewerOpen(false)}
          >
            <X size={20} />
          </button>

          {hasMultiple ? (
            <button
              type="button"
              aria-label="Midia anterior"
              className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft size={24} />
            </button>
          ) : null}

          <div
            className="flex max-h-full max-w-full flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <MediaTile
              item={activeItem}
              className="max-h-[82vh] max-w-[92vw] rounded-2xl object-contain"
            />
            {hasMultiple ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {counterLabel}
              </span>
            ) : null}
          </div>

          {hasMultiple ? (
            <button
              type="button"
              aria-label="Proxima midia"
              className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight size={24} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
