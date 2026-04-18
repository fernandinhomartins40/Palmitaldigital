import { Avatar, Card } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';

export function BusinessCard({ post }: { post: any }) {
  const company = post.company;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Link to={`/companies/${company?.slug}`}>
          <Avatar src={company?.logoUrl} name={company?.name ?? 'Empresa'} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 justify-between">
            <Link to={`/companies/${company?.slug}`} className="flex items-center gap-1 font-semibold text-gray-900 hover:underline">
              {company?.name}
              {company?.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
            </Link>
            <span className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</span>
          </div>
          <span className="text-xs text-blue-600 font-medium">Empresa</span>
          {post.content && <p className="mt-1 text-gray-800 whitespace-pre-wrap">{post.content}</p>}
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
