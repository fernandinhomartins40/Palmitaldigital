import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Spinner } from '@palmital/ui';
import {
  BriefcaseBusiness,
  CarFront,
  Home,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Store,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClassifiedCard } from '../../components/feed/ClassifiedCard';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

type Category = { id: string; name: string };

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('veic')) return CarFront;
  if (n.includes('imov') || n.includes('casa')) return Home;
  if (n.includes('emprego') || n.includes('vaga')) return BriefcaseBusiness;
  if (n.includes('moda') || n.includes('roupa')) return Shirt;
  if (n.includes('servi') || n.includes('reparo')) return Wrench;
  return Store;
}

export function ClassifiedsPage() {
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const currentUser = useAuthStore((s) => s.user);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data as Category[];
    },
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['classifieds', { categoryId, city }],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 20, status: 'ACTIVE' };
      if (pageParam) params.cursor = pageParam;
      if (categoryId) params.categoryId = categoryId;
      if (city) params.city = city;
      const response = await api.get('/classifieds', { params });
      return response.data as { items: any[]; nextCursor: string | null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const activeCategory = categories?.find((c) => c.id === categoryId);

  return (
    <div className="space-y-5">
      {/* HERO Mercado */}
      <section className="glass shape-signature-lg halo halo-citrus relative overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="chip chip-citrus">
              <Store size={11} strokeWidth={2.5} />
              MERCADO LOCAL
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
              Compre e venda<br />com a sua cidade.
            </h1>
            <p className="mt-3 max-w-xl text-base text-mute lg:text-lg">
              Tudo de Palmital reunido — sem comissão, sem intermediário.
            </p>
            {currentUser && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/create" className="chip chip-citrus hover:scale-105 transition-transform">
                  + Anunciar
                </Link>
                <Link to="/classifieds/mine" className="chip border border-line hover:scale-105 transition-transform">
                  Meus anúncios
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 lg:min-w-[280px]">
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-citrus" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Anúncios</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{items.length}</p>
            </div>
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-coral" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Categorias</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {categories?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <div className="glass shape-signature p-4 lg:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
                Filtros
              </p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
                Encontre o que precisa
              </h2>
            </div>

            <label className="relative block w-full lg:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute"
              />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-full rounded-2xl border border-line bg-ink/[0.03] py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-2 focus:ring-coral/15 dark:bg-white/[0.04]"
              />
            </label>
          </div>

          <div className="glass-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId('')}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                !categoryId
                  ? 'halo halo-coral bg-ink text-surface'
                  : 'border border-line bg-ink/[0.02] text-ink hover:bg-ink/[0.06] dark:bg-white/[0.04]'
              }`}
            >
              <Sparkles size={14} strokeWidth={2.4} />
              Todos
            </button>

            {categories?.map((category) => {
              const Icon = getCategoryIcon(category.name);
              const isActive = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(isActive ? '' : category.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'halo halo-citrus bg-citrus text-ink'
                      : 'border border-line bg-ink/[0.02] text-ink hover:bg-ink/[0.06] dark:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} strokeWidth={2.2} />
                  {category.name}
                </button>
              );
            })}
          </div>

          {(activeCategory || city) && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-ink/[0.03] px-3 py-2.5 text-sm dark:bg-white/[0.04]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Filtrado:</span>
              {activeCategory && <span className="chip chip-citrus">{activeCategory.name}</span>}
              {city && (
                <span className="chip">
                  <MapPin size={10} />
                  {city}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <InfiniteList
          items={items}
          renderItem={(item) => (
            <ClassifiedCard
              key={item.id}
              post={{ ...item.post, classified: item, author: item.author }}
            />
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
