import { Avatar, Card } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';
import { PostMediaGallery } from './PostMediaGallery';

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
          {post.content && <p className="mt-1 whitespace-pre-wrap break-words text-gray-800">{post.content}</p>}
          <PostMediaGallery media={post.media ?? []} />
        </div>
      </div>
    </Card>
  );
}
