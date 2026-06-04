import { Avatar } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { PostMediaGallery } from './PostMediaGallery';

export function SocialCard({ post }: { post: any }) {
  const profile = post.author?.profile;
  const name = profile?.displayName ?? 'Usuário';
  const hasMedia = Boolean(post.media?.length);

  return (
    <article className="glass shape-signature relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <Link to={`/profile/${post.authorId}`} className="shrink-0">
          <Avatar src={profile?.avatarUrl} name={name} size="md" accent="coral" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={`/profile/${post.authorId}`}
              className="font-semibold text-sm text-ink hover:text-coral transition-colors"
            >
              {name}
            </Link>
            <span className="shrink-0 text-[11px] text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {profile?.city && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-mute">
              <MapPin size={10} />
              {profile.city}
            </span>
          )}
        </div>
      </div>

      {/* Texto */}
      {post.content && (
        <p className={`px-5 whitespace-pre-wrap break-words text-ink ${
          hasMedia ? 'mt-2 text-[14px] leading-6' : 'mt-2.5 text-[15px] leading-7'
        }`}>
          {post.content}
        </p>
      )}

      {/* Mídia largura total */}
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
