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
    <article className="glass shape-signature halo halo-coral relative p-5">
      <div className="flex items-start gap-3">
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {profile?.city && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
              {profile.city}
            </p>
          )}

          {post.content && (
            <p
              className={`mt-3 whitespace-pre-wrap break-words text-ink ${
                hasMedia ? 'text-[15px] leading-6' : 'text-[16px] leading-7'
              }`}
            >
              {post.content}
            </p>
          )}

          <PostMediaGallery media={post.media ?? []} />
          <PostEngagement post={post} accent="coral" />
        </div>
      </div>
    </article>
  );
}
