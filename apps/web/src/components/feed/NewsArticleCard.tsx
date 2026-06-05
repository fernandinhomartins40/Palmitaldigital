import { Clock, MessageCircle, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Article } from '../../services/newsApi';

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'agora';
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function NewsArticleCard({ article }: { article: Article }) {
  const authorName = article.author.profile.displayName;
  const date = article.publishedAt ?? article.createdAt;

  return (
    <article className="glass shape-signature relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-magenta/10">
          <Newspaper size={16} className="text-magenta" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-magenta font-semibold">
              {article.category?.name ?? 'Notícia'}
            </span>
            <span className="shrink-0 text-[11px] text-mute flex items-center gap-1">
              <Clock size={10} />
              {formatRelative(date)}
            </span>
          </div>
          <p className="text-[11px] text-mute truncate">{authorName}</p>
        </div>
      </div>

      {/* Cover image full-width */}
      {article.coverUrl && (
        <Link to={`/news/article/${article.slug}`} className="block mt-3">
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-44 object-cover"
          />
        </Link>
      )}

      {/* Title + excerpt */}
      <div className={`px-5 ${article.coverUrl ? 'mt-3' : 'mt-2'}`}>
        <Link
          to={`/news/article/${article.slug}`}
          className="block font-display text-base font-bold leading-snug text-ink hover:text-magenta transition-colors"
        >
          {article.title}
        </Link>
        {article.excerpt && (
          <p className="mt-1 text-[13px] leading-5 text-mute line-clamp-2">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className="px-5 mt-2 flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip text-[10px] text-mute border border-line">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 pb-3 mt-3 flex items-center justify-between">
        <Link
          to={`/news/article/${article.slug}`}
          className="text-[12px] font-semibold text-magenta hover:underline"
        >
          Ler matéria completa →
        </Link>
        {article._count && article._count.comments > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-mute">
            <MessageCircle size={12} />
            {article._count.comments}
          </span>
        )}
      </div>
    </article>
  );
}
