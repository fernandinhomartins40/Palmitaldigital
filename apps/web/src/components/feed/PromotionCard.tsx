import { PromotionKind } from '@palmital/types';
import { Avatar } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  MapPin,
  Package2,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';

function HighlightList({ highlights }: { highlights?: string[] }) {
  if (!highlights?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {highlights.map((highlight) => (
        <span
          key={highlight}
          className="chip border border-line"
        >
          {highlight}
        </span>
      ))}
    </div>
  );
}

function ProfessionalPromotionCard({ post }: { post: any }) {
  const profile = post.author?.profile;
  const headline = post.promotion?.headline ?? profile?.displayName ?? 'Profissional local';
  const subtitle = post.promotion?.subtitle ?? post.content;

  return (
    <article className="glass shape-signature halo halo-magenta relative overflow-hidden p-5">
      {/* Selo de impulsionado */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-magenta opacity-[0.12] blur-2xl" />

      <div className="relative flex items-start gap-4">
        <Link to={`/profile/${post.authorId}`} className="shrink-0">
          <Avatar
            src={profile?.avatarUrl}
            name={headline}
            size="lg"
            accent="magenta"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="chip chip-magenta">
              <Sparkles size={10} strokeWidth={2.5} />
              IMPULSIONADO
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          <Link
            to={`/profile/${post.authorId}`}
            className="mt-2 block font-display text-xl font-bold tracking-tight text-ink hover:text-magenta"
          >
            {headline}
          </Link>

          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-magenta">
            <BriefcaseBusiness size={10} className="mr-1 inline" />
            Profissional liberal
          </p>

          {subtitle && <p className="mt-3 text-sm leading-6 text-ink">{subtitle}</p>}

          <HighlightList highlights={post.promotion?.highlights} />

          <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono uppercase tracking-wider text-mute">
            {post.promotion?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {post.promotion.city}
              </span>
            )}
            {post.author?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} />
                {post.author.phone}
              </span>
            )}
          </div>

          <Link
            to={`/profile/${post.authorId}`}
            className="mt-4 flex items-center justify-between rounded-xl border border-line bg-ink/[0.02] px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-magenta hover:text-white dark:bg-white/[0.04]"
          >
            <span>Ver perfil profissional</span>
            <ArrowUpRight size={16} strokeWidth={2.4} />
          </Link>

          <PostEngagement post={post} accent="magenta" />
        </div>
      </div>
    </article>
  );
}

function CompanyPromotionCard({ post }: { post: any }) {
  const company = post.company;
  const promotion = post.promotion;
  const products = promotion?.products?.map((item: any) => item.product).filter(Boolean) ?? [];
  const showProducts = promotion?.kind === PromotionKind.COMPANY_PRODUCTS && products.length > 0;

  return (
    <article className="glass shape-signature halo halo-magenta relative overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Link to={`/companies/${company?.slug}`} className="shrink-0">
            <Avatar
              src={company?.logoUrl}
              name={company?.name ?? 'Empresa'}
              size="lg"
              accent="magenta"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="chip chip-magenta">
                <Sparkles size={10} strokeWidth={2.5} />
                {showProducts ? 'VITRINE' : 'DESTAQUE'}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            <Link
              to={`/companies/${company?.slug}`}
              className="mt-2 flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-ink hover:text-magenta"
            >
              {company?.name}
              {company?.isVerified && (
                <BadgeCheck size={16} className="fill-cobalt text-surface" />
              )}
            </Link>

            <p className="mt-3 font-display text-xl font-bold tracking-tight text-ink">
              {promotion?.headline}
            </p>
            {(promotion?.subtitle || post.content) && (
              <p className="mt-2 text-sm leading-6 text-mute">
                {promotion?.subtitle ?? post.content}
              </p>
            )}
            <HighlightList highlights={promotion?.highlights} />
          </div>
        </div>
      </div>

      {showProducts && (
        <div className="grid gap-2 border-t border-line px-5 pb-5 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-line bg-ink/[0.02] dark:bg-white/[0.03]"
            >
              <div className="aspect-[4/3] bg-ink/5 dark:bg-white/5">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-mute">
                    <Package2 size={28} strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 font-display text-sm font-bold text-ink">{product.name}</p>
                {product.description && (
                  <p className="line-clamp-2 text-xs leading-4 text-mute">{product.description}</p>
                )}
                {product.price ? (
                  <p className="font-mono text-sm font-bold text-ink">
                    {formatCurrency(Number(product.price))}
                  </p>
                ) : (
                  <p className="font-mono text-xs uppercase tracking-wider text-mute">A consultar</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!showProducts && (company?.category || company?.city || company?.phone) && (
        <div className="border-t border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-mute">
            {company?.category && <span className="chip">{company.category}</span>}
            {company?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {company.city}
              </span>
            )}
            {company?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} />
                {company.phone}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-line px-5 py-3">
        <PostEngagement post={post} accent="magenta" compact />
      </div>
    </article>
  );
}

export function PromotionCard({ post }: { post: any }) {
  if (post.promotion?.kind === PromotionKind.PROFESSIONAL) {
    return <ProfessionalPromotionCard post={post} />;
  }
  return <CompanyPromotionCard post={post} />;
}
