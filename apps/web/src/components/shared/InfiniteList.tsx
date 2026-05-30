import { type ReactNode, useEffect, useRef } from 'react';
import { Spinner } from '@palmital/ui';

interface InfiniteListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  emptyMessage?: string;
}

export function InfiniteList<T extends { id: string }>({
  items,
  renderItem,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  emptyMessage = 'Nenhum item encontrado',
}: InfiniteListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (items.length === 0) {
    return (
      <div className="glass shape-signature px-4 py-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Vazio</p>
        <p className="mt-1 font-display font-bold text-ink">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="w-full">
          {renderItem(item)}
        </div>
      ))}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}
