import { Card } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

export function ClassifiedCard({ post }: { post: any }) {
  const classified = post.classified;
  const thumb = post.media?.[0]?.url;
  const profile = post.author?.profile;

  return (
    <Link to={`/classifieds/${classified?.id}`}>
      <Card className="flex gap-3 p-3 hover:shadow-md transition-shadow">
        <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={classified?.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Tag size={28} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{classified?.title}</p>
          <p className="text-blue-600 font-bold">
            {classified?.isFree ? 'Grátis' : classified?.price ? formatCurrency(Number(classified.price)) : 'Consultar'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {profile?.displayName} · {formatRelativeTime(post.createdAt)}
          </p>
          {classified?.city && <p className="text-xs text-gray-500">{classified.city}</p>}
        </div>
      </Card>
    </Link>
  );
}
