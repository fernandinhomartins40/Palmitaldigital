import { Avatar, Card } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { MessageSquareText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostMediaGallery } from './PostMediaGallery';

export function SocialCard({ post }: { post: any }) {
  const profile = post.author?.profile;
  const name = profile?.displayName ?? 'Usuario';
  const hasMedia = Boolean(post.media?.length);

  return (
    <Card
      className={`overflow-hidden rounded-[28px] border p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ${
        hasMedia
          ? 'border-slate-200 bg-white'
          : 'border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.authorId}`}>
          <Avatar src={profile?.avatarUrl} name={name} size="md" className={hasMedia ? '' : 'ring-4 ring-slate-100'} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {hasMedia ? <Sparkles size={12} /> : <MessageSquareText size={12} />}
                {hasMedia ? 'Feed visual' : 'Conversa local'}
              </div>
              <Link to={`/profile/${post.authorId}`} className="mt-2 block font-semibold text-slate-900 hover:underline">
                {name}
              </Link>
            </div>

            <span className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</span>
          </div>

          {post.content && (
            <p className={`mt-3 whitespace-pre-wrap break-words text-slate-700 ${hasMedia ? '' : 'text-[15px] leading-7'}`}>
              {post.content}
            </p>
          )}

          {!hasMedia && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Publicacao em texto pensada para leitura rapida no feed.
            </div>
          )}

          <PostMediaGallery media={post.media ?? []} />
        </div>
      </div>
    </Card>
  );
}
