import { Avatar } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { PostMediaGallery } from './PostMediaGallery';

export function SocialCard({ post }: { post: any }) {
  const profile = post.author?.profile;
  const name = profile?.displayName ?? 'Usuario';
  const hasMedia = Boolean(post.media?.length);

  return (
    <article className="glass shape-signature halo halo-coral relative overflow-hidden">
      {/* Header: avatar + nome + hora */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <Link to={`/profile/${post.authorId}`} className="shrink-0">
          <Avatar src={profile?.avatarUrl} name={name} size="md" accent="coral" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={`/profile/${post.authorId}`}
              className="font-display text-base font-bold tracking-tight text-ink hover:text-coral"
            >
              {name}
            </Link>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {profile?.city && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              {profile.city}
            </p>
          )}
        </div>
      </div>

      {/* Conteúdo texto */}
      {post.content && (
        <p
          className={`px-5 whitespace-pre-wrap break-words text-ink ${
            hasMedia ? 'mt-3 text-[15px] leading-6' : 'mt-3 text-[16px] leading-7'
          }`}
        >
          {post.content}
        </p>
      )}

      {/* Mídia em largura total */}
      {hasMedia && (
        <div className="mt-3">
          <PostMediaGallery media={post.media ?? []} />
        </div>
      )}

      {/* Engajamento */}
      <div className="px-5 pb-1">
        <PostEngagement post={post} accent="coral" />
      </div>
    </article>
  );
}
