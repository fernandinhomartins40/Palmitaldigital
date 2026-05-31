import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PenLine, Clock, MessageCircle, ChevronRight } from 'lucide-react';
import { useNewsPortal } from '../../hooks/useNews';
import { useAuthStore } from '../../store/authStore';
import type { Article, NewsCategory } from '../../services/newsApi';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Link
      to={`/news/article/${article.slug}`}
      className={`group block glass rounded-3xl overflow-hidden transition-all hover:shadow-lg ${
        featured ? 'col-span-full md:col-span-2' : ''
      }`}
    >
      {article.coverUrl && (
        <div className={`overflow-hidden ${featured ? 'h-56 md:h-72' : 'h-40'}`}>
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      {!article.coverUrl && featured && (
        <div className="h-56 md:h-72 bg-magenta/10 flex items-center justify-center">
          <span className="text-6xl opacity-20">📰</span>
        </div>
      )}
      <div className="p-4">
        {article.category && (
          <span
            className="chip text-xs mb-2 inline-block"
            style={{ background: `${article.category.color}20`, color: article.category.color }}
          >
            {article.category.name}
          </span>
        )}
        <h3
          className={`font-semibold text-ink leading-snug mb-2 group-hover:text-magenta transition-colors ${
            featured ? 'text-xl md:text-2xl' : 'text-base'
          }`}
        >
          {article.title}
        </h3>
        {featured && (
          <p className="text-mute text-sm line-clamp-2 mb-3">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-mute">
          <span className="font-medium">{article.author.profile.displayName}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(article.publishedAt || article.createdAt)}
          </span>
          {article._count && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {article._count.comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CategoryPill({
  cat,
  active,
  onClick,
}: {
  cat: NewsCategory;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="chip text-sm px-4 py-1.5 whitespace-nowrap transition-all"
      style={
        active
          ? { background: cat.color, color: '#fff' }
          : { background: `${cat.color}18`, color: cat.color }
      }
    >
      {cat.name}
    </button>
  );
}

export function NewsPortalPage() {
  const [activeCat, setActiveCat] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { articles, categories, loading } = useNewsPortal(activeCat, search || undefined);
  const user = useAuthStore((s) => s.user);
  const isJournalist = user?.role === 'JOURNALIST' || user?.role === 'ADMIN';

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="halo halo-magenta glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Notícias de Palmital</h1>
            <p className="text-mute text-sm">Jornalismo local, de verdade</p>
          </div>
          <div className="flex gap-2">
            {isJournalist ? (
              <Link to="/news/write" className="btn-ink flex items-center gap-2 text-sm">
                <PenLine className="w-4 h-4" />
                Escrever
              </Link>
            ) : (
              <Link
                to="/news/apply"
                className="btn-glass flex items-center gap-2 text-sm"
                style={{ color: 'var(--magenta)', borderColor: 'color-mix(in srgb, var(--magenta) 20%, transparent)' }}
              >
                Quero escrever
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            className="w-full glass-strong rounded-2xl pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50"
            placeholder="Buscar notícias..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setActiveCat(undefined); setSearch(''); }}
              className="chip text-sm px-4 py-1.5 whitespace-nowrap transition-all"
              style={
                !activeCat
                  ? { background: 'var(--magenta)', color: '#fff' }
                  : { background: 'color-mix(in srgb, var(--magenta) 12%, transparent)', color: 'var(--magenta)' }
              }
            >
              Todas
            </button>
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                cat={c}
                active={activeCat === c.id}
                onClick={() => setActiveCat(activeCat === c.id ? undefined : c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-3xl h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && articles.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-4xl mb-3">📰</p>
          <p className="font-semibold text-ink">Nenhuma notícia ainda</p>
          <p className="text-mute text-sm mt-1">
            {isJournalist ? 'Seja o primeiro a publicar!' : 'Aguarde as primeiras publicações.'}
          </p>
        </div>
      )}

      {/* Articles grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured && <ArticleCard article={featured} featured />}
          {rest.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
