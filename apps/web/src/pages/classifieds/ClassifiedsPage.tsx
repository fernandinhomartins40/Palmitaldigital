import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Card, Spinner } from '@palmital/ui';
import {
  BriefcaseBusiness,
  CarFront,
  ChevronRight,
  Home,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Store,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClassifiedCard } from '../../components/feed/ClassifiedCard';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { api } from '../../services/api';

type Category = {
  id: string;
  name: string;
};

type InterestCard = {
  key: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  categoryId?: string;
  accent: string;
};

function getCategoryIcon(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('veic')) return CarFront;
  if (normalized.includes('imov') || normalized.includes('casa')) return Home;
  if (normalized.includes('emprego') || normalized.includes('vaga')) return BriefcaseBusiness;
  if (normalized.includes('moda') || normalized.includes('roupa')) return Shirt;
  if (normalized.includes('servi') || normalized.includes('reparo')) return Wrench;

  return Store;
}

function buildInterestCards(categories: Category[], city: string): InterestCard[] {
  const quickCards: InterestCard[] = [
    {
      key: 'nearby',
      title: city ? city : 'Perto de voce',
      description: city ? 'Classificados filtrados para esta cidade.' : 'Explore ofertas locais e anuncios recentes.',
      icon: MapPin,
      accent: 'from-sky-500 via-blue-500 to-indigo-500',
    },
  ];

  categories.slice(0, 3).forEach((category, index) => {
    const accents = [
      'from-orange-500 via-amber-400 to-yellow-300',
      'from-emerald-500 via-teal-400 to-cyan-300',
      'from-fuchsia-500 via-violet-500 to-indigo-400',
    ];

    quickCards.push({
      key: category.id,
      title: category.name,
      description: 'Descubra anuncios desta categoria com destaque visual.',
      icon: getCategoryIcon(category.name),
      categoryId: category.id,
      accent: accents[index % accents.length],
    });
  });

  return quickCards;
}

export function ClassifiedsPage() {
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');

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
  const interestCards = useMemo(() => buildInterestCards(categories ?? [], city), [categories, city]);
  const activeCategory = categories?.find((category) => category.id === categoryId);

  return (
    <div className="space-y-5 px-4 pb-8">
      <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#4338ca_100%)] px-5 py-6 text-white shadow-[0_24px_60px_rgba(37,99,235,0.16)]">
        <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_62%)]" />
        <div className="absolute -bottom-10 right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-50/95 backdrop-blur-sm">
              <Sparkles size={12} />
              Classificados locais
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] lg:text-[2.5rem]">
              Encontre oportunidades com um feed mais inteligente
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50/85 lg:text-base">
              Descubra anuncios por interesse, categoria e cidade sem cair em uma lista generica.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[300px]">
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100/80">Anuncios</p>
              <p className="mt-1 text-2xl font-semibold">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100/80">Categorias</p>
              <p className="mt-1 text-2xl font-semibold">{categories?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">Interesses em destaque</h2>
            <p className="text-sm text-slate-500">Atalhos para navegar pelos tipos de anuncio mais relevantes.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {interestCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.categoryId ? categoryId === card.categoryId : !categoryId;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setCategoryId(card.categoryId ?? '')}
                className={`group relative overflow-hidden rounded-[26px] p-[1px] text-left transition-transform hover:-translate-y-0.5 ${
                  isActive ? 'shadow-[0_18px_42px_rgba(37,99,235,0.18)]' : 'shadow-[0_12px_30px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-95`} />
                <div className="relative flex h-full min-h-[168px] flex-col justify-between rounded-[25px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] p-4 text-white backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                      <Icon size={20} />
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        isActive ? 'bg-slate-950 text-white' : 'bg-white/16 text-white/92'
                      }`}
                    >
                      {isActive ? 'ativo' : 'explorar'}
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-semibold tracking-[-0.02em]">{card.title}</p>
                    <p className="mt-1 text-sm leading-5 text-white/82">{card.description}</p>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/92">
                    Abrir selecao
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="rounded-[28px] border border-slate-200/80 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Filtros</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">Tipos de classificados</h2>
              <p className="mt-1 text-sm text-slate-500">
                Escolha um caminho rapido por categoria ou refine por cidade.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Buscar por cidade"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:bg-white"
              />
            </label>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setCategoryId('')}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                !categoryId
                  ? 'border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={16} />
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
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {category.name}
                </button>
              );
            })}
          </div>

          {(activeCategory || city) && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Selecao atual:</span>
              {activeCategory && (
                <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">{activeCategory.name}</span>
              )}
              {city && <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">{city}</span>}
            </div>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <InfiniteList
          items={items}
          renderItem={(item) => (
            <ClassifiedCard key={item.id} post={{ ...item.post, classified: item, author: item.author }} />
          )}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          emptyMessage="Nenhum anuncio encontrado"
        />
      )}
    </div>
  );
}
