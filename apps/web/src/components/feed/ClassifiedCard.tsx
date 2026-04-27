import { Card } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

export function ClassifiedCard({ post }: { post: any }) {
  const classified = post.classified;
  const thumb = post.media?.[0]?.url;
  const profile = post.author?.profile;

  return (
    <Link to={`/classifieds/${classified?.id}`} className="block">
      <Card className="flex gap-3 p-3 transition-shadow hover:shadow-md">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
          {thumb ? (
            <img src={thumb} alt={classified?.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Tag size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{classified?.title}</p>
          <p className="font-bold text-blue-600">
            {classified?.isFree ? 'Grátis' : classified?.price ? formatCurrency(Number(classified.price)) : 'Consultar'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {profile?.displayName} · {formatRelativeTime(post.createdAt)}
          </p>
          {classified?.city && <p className="text-xs text-gray-500">{classified.city}</p>}
        </div>
      </Card>
    </Link>
  );
}
