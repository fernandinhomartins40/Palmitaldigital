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
      {/* Faixa superior de cor */}
      <div className="h-1 w-full bg-cobalt" />

      {/* Header: avatar + nome + hora */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <Link to={`/companies/${company?.slug}`} className="shrink-0">
          <Avatar
            src={company?.logoUrl}
            name={company?.name ?? 'Empresa'}
            size="md"
            accent="cobalt"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/companies/${company?.slug}`}
              className="flex items-center gap-1.5 font-display text-base font-bold tracking-tight text-ink hover:text-cobalt"
            >
              <span className="truncate">{company?.name}</span>
              {company?.isVerified && (
                <BadgeCheck size={15} className="shrink-0 fill-cobalt text-surface" />
              )}
            </Link>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <div className="chip chip-cobalt mt-0.5 w-fit">
            <Building2 size={9} strokeWidth={2.5} />
            EMPRESA
          </div>
        </div>
      </div>

      {/* Texto do post */}
      {post.content && (
        <p className="mt-3 px-5 whitespace-pre-wrap text-[15px] leading-6 text-ink">
          {post.content}
        </p>
      )}

      {/* Mídia em largura total */}
      {post.media?.length > 0 && (
        <div className="mt-3">
          <PostMediaGallery media={post.media ?? []} />
        </div>
      )}

      {/* Engajamento */}
      <div className="px-5 pb-1">
        <PostEngagement post={post} accent="cobalt" />
      </div>
    </article>
  );
}
