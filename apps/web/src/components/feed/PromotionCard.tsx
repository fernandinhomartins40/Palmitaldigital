import { PromotionKind } from '@palmital/types';
import { Avatar, Card } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  MapPin,
  Package2,
  Phone,
  Sparkles,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function HighlightList({ highlights }: { highlights?: string[] }) {
  if (!highlights?.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {highlights.map((highlight) => (
        <span
          key={highlight}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
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
    <Card className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_60%)] p-0 shadow-[0_16px_40px_rgba(245,158,11,0.08)]">
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-4 py-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm">
          <Sparkles size={12} />
          Impulsionado
        </div>
        <span className="text-xs text-amber-700/80">{formatRelativeTime(post.createdAt)}</span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.authorId}`}>
            <Avatar src={profile?.avatarUrl} name={headline} size="lg" className="h-14 w-14 ring-4 ring-amber-100" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Profissional liberal</p>
                <Link to={`/profile/${post.authorId}`} className="mt-1 block text-xl font-semibold tracking-[-0.02em] text-slate-900 hover:underline">
                  {headline}
                </Link>
              </div>
              <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                <BriefcaseBusiness size={18} />
              </div>
            </div>

            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>}

            <HighlightList highlights={post.promotion?.highlights} />

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              {post.promotion?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {post.promotion.city}
                </span>
              )}
              {post.author?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} />
                  {post.author.phone}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-100 bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Ver perfil profissional</span>
              <ArrowUpRight size={16} className="text-amber-700" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompanyPromotionCard({ post }: { post: any }) {
  const company = post.company;
  const promotion = post.promotion;
  const products = promotion?.products?.map((item: any) => item.product).filter(Boolean) ?? [];

  return (
    <Card className="overflow-hidden rounded-[30px] border border-blue-200/70 bg-white p-0 shadow-[0_18px_44px_rgba(37,99,235,0.08)]">
      <div className="bg-[linear-gradient(135deg,#eff6ff_0%,#eef2ff_55%,#ffffff_100%)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={`/companies/${company?.slug}`}>
              <Avatar src={company?.logoUrl} name={company?.name ?? 'Empresa'} size="lg" className="h-14 w-14 ring-4 ring-white" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                <Sparkles size={12} />
                Impulsionado
              </div>
              <Link
                to={`/companies/${company?.slug}`}
                className="mt-2 flex items-center gap-1 text-lg font-semibold tracking-[-0.02em] text-slate-900 hover:underline"
              >
                {company?.name}
                {company?.isVerified && <BadgeCheck size={15} className="text-blue-500" />}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {promotion?.kind === PromotionKind.COMPANY_PRODUCTS ? 'Vitrine em destaque' : 'Perfil de loja em destaque'}
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <div className="mt-4">
          <p className="text-xl font-semibold tracking-[-0.02em] text-slate-900">{promotion?.headline}</p>
          {(promotion?.subtitle || post.content) && (
            <p className="mt-2 text-sm leading-6 text-slate-600">{promotion?.subtitle ?? post.content}</p>
          )}
          <HighlightList highlights={promotion?.highlights} />
        </div>
      </div>

      {promotion?.kind === PromotionKind.COMPANY_PRODUCTS && products.length > 0 ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any) => (
            <div key={product.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <div className="aspect-[4/3] bg-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Package2 size={28} />
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 font-semibold text-slate-900">{product.name}</p>
                  <Store size={16} className="shrink-0 text-blue-500" />
                </div>
                {product.description && <p className="line-clamp-2 text-sm leading-5 text-slate-500">{product.description}</p>}
                {product.price ? (
                  <p className="text-sm font-semibold text-blue-700">{formatCurrency(Number(product.price))}</p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">Consulte disponibilidade</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 pt-0">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {company?.category && <span className="rounded-full bg-white px-3 py-1 shadow-sm">{company.category}</span>}
              {company?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {company.city}
                </span>
              )}
              {company?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} />
                  {company.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function PromotionCard({ post }: { post: any }) {
  if (post.promotion?.kind === PromotionKind.PROFESSIONAL) {
    return <ProfessionalPromotionCard post={post} />;
  }

  return <CompanyPromotionCard post={post} />;
}
