import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import { ArrowUpRight, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';

export function ClassifiedCard({ post }: { post: any }) {
  const classified = post.classified;
  const thumb = post.media?.[0]?.url;
  const profile = post.author?.profile;

  const priceLabel = classified?.isFree
    ? 'GRÁTIS'
    : classified?.price
      ? formatCurrency(Number(classified.price))
      : 'Consultar';

  return (
    <article className="glass shape-signature halo halo-citrus relative overflow-hidden p-0">
      <Link to={`/classifieds/${classified?.id}`} className="flex flex-col sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink/5 sm:aspect-square sm:w-44 dark:bg-white/5">
          {thumb ? (
            <img src={thumb} alt={classified?.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-mute">
              <Tag size={36} strokeWidth={1.2} />
            </div>
          )}

          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-citrus px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">
            <Tag size={10} strokeWidth={2.5} />
            Mercado
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight tracking-tight text-ink">
                {classified?.title}
              </h3>
              <p className="mt-2 font-mono text-xl font-bold text-ink">{priceLabel}</p>
            </div>
            <div className="halo halo-citrus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-citrus text-ink">
              <ArrowUpRight size={18} strokeWidth={2.4} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-mute">
            <span className="font-medium">{profile?.displayName}</span>
            {classified?.city && (
              <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wider">
                <MapPin size={11} />
                {classified.city}
              </span>
            )}
            <span className="font-mono uppercase tracking-wider">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {classified?.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-mute">{classified.description}</p>
          )}
        </div>
      </Link>

      <div className="border-t border-line px-5 py-3">
        <PostEngagement post={post} accent="citrus" compact />
      </div>
    </article>
  );
}
