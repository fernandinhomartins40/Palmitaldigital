import { Avatar } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { BadgeCheck, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { PostMediaGallery } from './PostMediaGallery';

export function BusinessCard({ post }: { post: any }) {
  const company = post.company;

  return (
    <article className="glass shape-signature relative overflow-hidden border-l-4 border-cobalt">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        <Link to={`/companies/${company?.slug}`} className="shrink-0">
          <Avatar
            src={company?.logoUrl}
            name={company?.name ?? 'Empresa'}
            size="sm"
            accent="cobalt"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/companies/${company?.slug}`}
              className="flex items-center gap-1 text-sm font-bold text-ink hover:text-cobalt transition-colors leading-tight"
            >
              <span className="truncate">{company?.name}</span>
              {company?.isVerified && (
                <BadgeCheck size={13} className="shrink-0 fill-cobalt text-surface" />
              )}
            </Link>
            <span className="shrink-0 text-[11px] text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cobalt">
            <Building2 size={9} strokeWidth={2.5} />
            Empresa
          </span>
        </div>
      </div>

      {/* Texto */}
      {post.content && (
        <p className="mt-3 px-5 whitespace-pre-wrap text-[15px] leading-6 text-ink">
          {post.content}
        </p>
      )}

      {/* Mídia largura total */}
      {post.media?.length > 0 && (
        <div className="mt-3">
          <PostMediaGallery media={post.media ?? []} />
        </div>
      )}

      {/* Engajamento + link loja */}
      <div className="flex items-center justify-between px-5 pb-1 pt-0">
        <PostEngagement post={post} accent="cobalt" />
        <Link
          to={`/companies/${company?.slug}`}
          className="shrink-0 flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-mute hover:text-cobalt transition-colors ml-3"
        >
          <ExternalLink size={11} />
          Ver loja
        </Link>
      </div>
    </article>
  );
}
