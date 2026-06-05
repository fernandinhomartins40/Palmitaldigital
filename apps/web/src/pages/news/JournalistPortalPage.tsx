import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, ExternalLink, MessageCircle, Newspaper, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { newsApi, type Article } from '../../services/newsApi';

interface JournalistProfile {
  id: string;
  profile: {
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    city?: string | null;
  };
}

function AdBanner({
  slot,
  label,
  className = '',
}: {
  slot: 'header' | 'sidebar' | 'inline';
  label: string;
  className?: string;
}) {
  const sizes: Record<string, string> = {
    header: 'h-24 md:h-28',
    sidebar: 'h-64',
    inline: 'h-20',
  };
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-line bg-ink/[0.02] dark:bg-white/[0.03] text-mute text-xs font-mono uppercase tracking-wider ${sizes[slot]} ${className}`}
    >
      <div className="text-center">
        <p className="text-[10px] opacity-50">ESPAÇO PUBLICITÁRIO</p>
        <p className="text-[10px] opacity-30 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ArticleRow({ article }: { article: Article }) {
  const date = new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  return (
    <Link
      to={`/news/article/${article.slug}`}
      className="group flex gap-4 rounded-2xl border border-line p-3 hover:bg-ink/[0.02] dark:hover:bg-white/[0.03] transition-colors"
    >
      {article.coverUrl && (
        <img
          src={article.coverUrl}
          alt=""
          className="h-20 w-28 shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        {article.category && (
          <span
            className="chip text-[10px] mb-1 inline-block"
            style={{ background: `${article.category.color}20`, color: article.category.color }}
          >
            {article.category.name}
          </span>
        )}
        <h3 className="font-semibold text-sm text-ink leading-snug group-hover:text-magenta transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[12px] text-mute mt-1 line-clamp-1">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-mute">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {date}
          </span>
          {article._count && article._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={10} />
              {article._count.comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function JournalistPortalPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const [journalist, setJournalist] = useState<JournalistProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorId) return;
    setLoading(true);
    Promise.all([
      api.get<JournalistProfile>(`/users/${authorId}`),
      newsApi.listByAuthor(authorId),
    ])
      .then(([userRes, artRes]) => {
        setJournalist(userRes.data);
        setArticles(artRes.data);
      })
      .finally(() => setLoading(false));
  }, [authorId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-ink/5" />
          <div className="h-64 rounded-3xl bg-ink/5" />
        </div>
      </div>
    );
  }

  if (!journalist) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-mute">
        Portal não encontrado.
      </div>
    );
  }

  const profile = journalist.profile;
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Voltar */}
      <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft size={14} />
        Notícias
      </Link>

      {/* Banner topo — espaço publicitário */}
      <AdBanner slot="header" label="728×90 · Leaderboard" />

      {/* Header do portal */}
      <div className="glass shape-signature p-5 flex items-start gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-magenta text-white font-display text-2xl font-bold">
            {profile.displayName[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-display text-xl font-bold text-ink">{profile.displayName}</h1>
              {profile.city && (
                <p className="text-sm text-mute">{profile.city}</p>
              )}
            </div>
            <span className="chip text-[10px] text-magenta border border-magenta/20 bg-magenta/5 shrink-0">
              <Newspaper size={9} />
              Jornalista
            </span>
          </div>
          {profile.bio && (
            <p className="mt-2 text-sm text-mute leading-relaxed line-clamp-3">{profile.bio}</p>
          )}
          <p className="mt-2 text-xs text-mute">
            {articles.length} {articles.length === 1 ? 'matéria publicada' : 'matérias publicadas'}
          </p>
        </div>
      </div>

      {/* Layout 2 colunas: conteúdo + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">

          {/* Destaque */}
          {featured && (
            <Link
              to={`/news/article/${featured.slug}`}
              className="group block glass shape-signature overflow-hidden"
            >
              {featured.coverUrl && (
                <img src={featured.coverUrl} alt="" className="w-full h-52 object-cover" />
              )}
              <div className="p-4">
                {featured.category && (
                  <span
                    className="chip text-xs mb-2 inline-block"
                    style={{ background: `${featured.category.color}20`, color: featured.category.color }}
                  >
                    {featured.category.name}
                  </span>
                )}
                <h2 className="font-display text-lg font-bold text-ink leading-snug group-hover:text-magenta transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-1 text-sm text-mute line-clamp-2">{featured.excerpt}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-magenta">
                  Ler matéria <ExternalLink size={11} />
                </span>
              </div>
            </Link>
          )}

          {/* Anúncio inline */}
          <AdBanner slot="inline" label="468×60 · Banner" />

          {/* Demais artigos */}
          {rest.length > 0 && (
            <div className="space-y-3">
              {rest.map((a) => <ArticleRow key={a.id} article={a} />)}
            </div>
          )}

          {articles.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-mute">
              <p className="text-3xl mb-2">📰</p>
              <p>Nenhuma matéria publicada ainda.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <AdBanner slot="sidebar" label="300×250 · Medium Rectangle" />
          <AdBanner slot="sidebar" label="300×250 · Medium Rectangle" />

          {/* Tags mais usadas */}
          {articles.length > 0 && (() => {
            const tagCount: Record<string, number> = {};
            articles.forEach((a) => a.tags?.forEach((t) => { tagCount[t] = (tagCount[t] ?? 0) + 1; }));
            const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
            return tags.length > 0 ? (
              <div className="glass shape-signature p-4 space-y-3">
                <h3 className="font-semibold text-sm text-ink">Assuntos</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(([tag]) => (
                    <Link
                      key={tag}
                      to={`/news?tag=${tag}`}
                      className="chip text-xs text-mute border border-line hover:border-magenta hover:text-magenta transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
