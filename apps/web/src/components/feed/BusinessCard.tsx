import { Avatar } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { BadgeCheck, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { PostMediaGallery } from './PostMediaGallery';

export function BusinessCard({ post }: { post: any }) {
  const company = post.company;

  return (
    <article className="glass shape-signature halo halo-cobalt relative overflow-hidden">
      {/* Faixa vertical de cor à esquerda como assinatura */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cobalt" />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-3">
          <Link to={`/companies/${company?.slug}`} className="shrink-0">
            <Avatar
              src={company?.logoUrl}
              name={company?.name ?? 'Empresa'}
              size="md"
              accent="cobalt"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="chip chip-cobalt">
                  <Building2 size={10} strokeWidth={2.5} />
                  EMPRESA
                </div>
                <Link
                  to={`/companies/${company?.slug}`}
                  className="mt-2 flex items-center gap-1.5 font-display text-base font-bold tracking-tight text-ink hover:text-cobalt"
                >
                  <span className="truncate">{company?.name}</span>
                  {company?.isVerified && (
                    <BadgeCheck size={16} className="shrink-0 fill-cobalt text-surface" />
                  )}
                </Link>
              </div>

              <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            {post.content && (
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-ink">
                {post.content}
              </p>
            )}

            <PostMediaGallery media={post.media ?? []} />
            <PostEngagement post={post} accent="cobalt" />
          </div>
        </div>
      </div>
    </article>
  );
}
