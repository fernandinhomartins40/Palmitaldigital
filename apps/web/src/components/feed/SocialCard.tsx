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
  const isTextOnly = !hasMedia;

  return (
    <article className="glass shape-signature relative overflow-hidden">
      <div className="flex gap-3 px-4 pt-4">
        {/* Avatar lateral estilo tweet */}
        <Link to={`/profile/${post.authorId}`} className="shrink-0 mt-0.5">
          <Avatar src={profile?.avatarUrl} name={name} size="md" accent="coral" />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Nome + cidade + hora na mesma linha */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/profile/${post.authorId}`}
                className="font-semibold text-sm text-ink hover:text-coral transition-colors"
              >
                {name}
              </Link>
              {profile?.city && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-mute">
                  <MapPin size={10} />
                  {profile.city}
                </span>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {/* Texto — tamanho maior para posts só-texto */}
          {post.content && (
            <p className={`mt-1 whitespace-pre-wrap break-words text-ink leading-relaxed ${
              isTextOnly ? 'text-[16px] leading-7' : 'text-[14px] leading-6'
            }`}>
              {post.content}
            </p>
          )}
        </div>
      </div>

      {/* Mídia largura total com margem do avatar */}
      {hasMedia && (
        <div className="mt-3 ml-[52px] mr-0 overflow-hidden rounded-tl-xl">
          <PostMediaGallery media={post.media ?? []} />
        </div>
      )}

      {/* Engajamento alinhado ao conteúdo */}
      <div className="pl-[52px] pr-4 pb-1">
        <PostEngagement post={post} accent="coral" />
      </div>
    </article>
  );
}
