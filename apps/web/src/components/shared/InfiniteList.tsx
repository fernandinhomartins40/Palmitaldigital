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
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (items.length === 0) {
    return <div className="py-12 text-center text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map(renderItem)}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}
