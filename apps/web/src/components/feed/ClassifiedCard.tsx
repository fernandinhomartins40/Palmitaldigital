import { Card } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import { ArrowUpRight, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';

export function ClassifiedCard({ post }: { post: any }) {
  const classified = post.classified;
  const thumb = post.media?.[0]?.url;
  const profile = post.author?.profile;

  return (
    <Card className="overflow-hidden rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_100%)] p-0 shadow-[0_16px_38px_rgba(16,185,129,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(16,185,129,0.12)]">
      <Link to={`/classifieds/${classified?.id}`} className="block">
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
            <Tag size={12} />
            Classificado
          </div>
          <span className="text-xs text-emerald-700/80">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <div className="flex gap-4 p-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-emerald-100">
            {thumb ? (
              <img src={thumb} alt={classified?.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-emerald-400">
                <Tag size={28} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-900">
                  {classified?.title}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {classified?.isFree
                    ? 'Gratis'
                    : classified?.price
                      ? formatCurrency(Number(classified.price))
                      : 'Consultar'}
                </p>
              </div>
              <ArrowUpRight size={16} className="shrink-0 text-emerald-600" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
              <span>{profile?.displayName}</span>
              {classified?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {classified.city}
                </span>
              )}
            </div>

            {classified?.description && (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {classified.description}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <PostEngagement post={post} />
      </div>
    </Card>
  );
}
