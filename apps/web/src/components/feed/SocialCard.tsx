import { Avatar, Card } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';

export function SocialCard({ post }: { post: any }) {
  const profile = post.author?.profile;
  const name = profile?.displayName ?? 'Usuário';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.authorId}`}>
          <Avatar src={profile?.avatarUrl} name={name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link to={`/profile/${post.authorId}`} className="font-semibold text-gray-900 hover:underline">
              {name}
            </Link>
            <span className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</span>
          </div>
          {post.content && <p className="mt-1 text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>}
          {post.media?.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.media.map((m: any) => (
                <img key={m.id} src={m.url} alt="" className="w-full rounded-xl object-cover aspect-square" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
