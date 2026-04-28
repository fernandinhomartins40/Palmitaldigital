import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { ClassifiedCard } from '../../components/feed/ClassifiedCard';
import { useState } from 'react';

export function ClassifiedsPage() {
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data as any[];
    },
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['classifieds', { categoryId, city }],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 20, status: 'ACTIVE' };
      if (pageParam) params.cursor = pageParam;
      if (categoryId) params.categoryId = categoryId;
      if (city) params.city = city;
      const { data } = await api.get('/classifieds', { params });
      return data as { items: any[]; nextCursor: string | null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="px-4 pb-6">
      <div className="mb-4 space-y-3 lg:flex lg:items-start lg:gap-4 lg:space-y-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            onClick={() => setCategoryId('')}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!categoryId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Todos
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${categoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filtrar por cidade..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 lg:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <InfiniteList
          items={items}
          renderItem={(item) => (
            <ClassifiedCard key={item.id} post={{ ...item.post, classified: item, author: item.author }} />
          )}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          emptyMessage="Nenhum anúncio encontrado"
        />
      )}
    </div>
  );
}
