import { Avatar, Card } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { BadgeCheck, Building2, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { PostMediaGallery } from './PostMediaGallery';

export function BusinessCard({ post }: { post: any }) {
  const company = post.company;

  return (
    <Card className="overflow-hidden rounded-[30px] border border-blue-200/80 bg-white p-0 shadow-[0_18px_42px_rgba(37,99,235,0.08)]">
      <div className="border-b border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#eef2ff_70%,#ffffff_100%)] px-4 py-4">
        <div className="flex items-start gap-3">
          <Link to={`/companies/${company?.slug}`}>
            <Avatar
              src={company?.logoUrl}
              name={company?.name ?? 'Empresa'}
              size="md"
              className="ring-4 ring-white"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                  <Megaphone size={12} />
                  Atualizacao comercial
                </div>
                <Link
                  to={`/companies/${company?.slug}`}
                  className="mt-2 flex items-center gap-1 truncate font-semibold text-slate-900 hover:underline"
                >
                  <span className="truncate">{company?.name}</span>
                  {company?.isVerified && (
                    <BadgeCheck size={14} className="shrink-0 text-blue-500" />
                  )}
                </Link>
              </div>

              <span className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</span>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700">
              <Building2 size={15} />
              Empresa local
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {post.content && <p className="whitespace-pre-wrap text-slate-700">{post.content}</p>}
        <PostMediaGallery media={post.media ?? []} />
        <PostEngagement post={post} />
      </div>
    </Card>
  );
}
