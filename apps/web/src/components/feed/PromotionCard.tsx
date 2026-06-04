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
  Plus,
  Sparkles,
  Store,
} from 'lucide-react';
// MapPin and Phone kept for ProfessionalPromotionCard
import { Link } from 'react-router-dom';
import { PostEngagement } from './PostEngagement';
import { useCompanyCartStore } from '../../store/companyCartStore';
import { useUIStore } from '../../store/uiStore';

function companyWhatsAppLink(company: any, message: string) {
  const digits = (company?.whatsapp || company?.phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

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
  const specialty = post.promotion?.subtitle ?? post.promotion?.category ?? null;
  const highlights: string[] = post.promotion?.highlights ?? [];
  const city: string | null = post.promotion?.city ?? null;
  const phone: string | null = post.author?.phone ?? post.author?.whatsapp ?? null;

  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^(\d{10,11})$/, '55$1')}?text=${encodeURIComponent(`Olá ${headline}, vi seu perfil na Palmital Digital e gostaria de um orçamento.`)}`
    : null;

  return (
    <article className="glass shape-signature relative overflow-hidden">
      {/* Faixa de cor no topo */}
      <div className="h-1.5 w-full rounded-t-[inherit]" style={{ background: 'var(--magenta)' }} />

      <div className="p-4 sm:p-5">
        {/* Header: avatar + nome + especialidade */}
        <div className="flex items-center gap-3.5">
          <Link to={`/profile/${post.authorId}`} className="shrink-0">
            <Avatar src={profile?.avatarUrl} name={headline} size="lg" accent="magenta" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile/${post.authorId}`}
                className="font-display text-lg font-bold leading-tight text-ink hover:text-magenta transition-colors"
              >
                {headline}
              </Link>
              <span className="chip chip-magenta shrink-0">
                <Sparkles size={9} strokeWidth={2.5} />
                DESTAQUE
              </span>
            </div>

            {specialty && (
              <p className="mt-0.5 text-sm text-mute leading-snug">{specialty}</p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
              <span className="inline-flex items-center gap-1">
                <BriefcaseBusiness size={11} />
                Profissional liberal
              </span>
              {city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} />
                  {city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Destaques / tags */}
        {highlights.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span key={h} className="chip border border-line text-mute">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-4 flex gap-2.5">
          <Link
            to={`/profile/${post.authorId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-ink/[0.02] px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 dark:bg-white/[0.03]"
          >
            Ver perfil
            <ArrowUpRight size={14} strokeWidth={2.4} />
          </Link>

          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              <Phone size={14} />
              Contato
            </a>
          ) : (
            <Link
              to={`/profile/${post.authorId}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-magenta px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <Phone size={14} />
              Contato
            </Link>
          )}
        </div>
      </div>

      {/* Engajamento compacto no rodapé */}
      <div className="border-t border-line px-4 py-2">
        <PostEngagement post={post} accent="magenta" compact />
      </div>
    </article>
  );
}

function StorefrontProductCard({ product, company }: { product: any; company: any }) {
  const addItem = useCompanyCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const hasPrice = product.price != null || product.promoPrice != null;
  const displayPrice = product.promoPrice != null ? Number(product.promoPrice) : product.price != null ? Number(product.price) : null;

  const handleAdd = () => {
    const phone = company?.whatsapp || company?.phone || null;
    addItem(company.id, company.name, company.slug, phone, product, 1);
    addToast(`${product.name} adicionado`, 'success');
    setCartDrawerOpen(true);
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-ink/[0.02] dark:bg-white/[0.03]">
        <div className="aspect-square bg-ink/5 dark:bg-white/5">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-mute">
              <Package2 size={20} strokeWidth={1.2} />
            </div>
          )}
        </div>
        <div className="p-2 space-y-1.5">
          <p className="line-clamp-1 text-xs font-semibold text-ink leading-tight">{product.name}</p>
          {displayPrice != null && (
            <div className="flex items-baseline gap-1.5">
              <p className="font-mono text-xs font-bold text-ink">{formatCurrency(displayPrice)}</p>
              {product.promoPrice != null && product.price != null && (
                <p className="font-mono text-[10px] text-mute line-through">{formatCurrency(Number(product.price))}</p>
              )}
            </div>
          )}
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-cobalt px-2 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={11} strokeWidth={2.5} />
            {hasPrice ? 'Adicionar' : 'Tenho interesse'}
          </button>
        </div>
      </div>
    </>
  );
}

function CompanyPromotionCard({ post }: { post: any }) {
  const company = post.company;
  const promotion = post.promotion;
  const products = promotion?.products?.map((item: any) => item.product).filter(Boolean) ?? [];
  const showProducts = promotion?.kind === PromotionKind.COMPANY_PRODUCTS && products.length > 0;

  return (
    <article className="glass shape-signature relative overflow-hidden">
      {/* Header compacto */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Link to={`/companies/${company?.slug}`} className="shrink-0">
          <Avatar
            src={company?.logoUrl}
            name={company?.name ?? 'Empresa'}
            size="sm"
            accent="magenta"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/companies/${company?.slug}`}
            className="flex items-center gap-1 font-semibold text-sm text-ink hover:text-magenta leading-tight"
          >
            {company?.name}
            {company?.isVerified && (
              <BadgeCheck size={13} className="fill-cobalt text-surface shrink-0" />
            )}
          </Link>
          <p className="text-xs text-mute truncate">{promotion?.headline}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="chip chip-magenta text-[10px]">
            <Sparkles size={9} strokeWidth={2.5} />
            {showProducts ? 'VITRINE' : 'DESTAQUE'}
          </div>
          <span className="font-mono text-[10px] text-mute">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Produtos */}
      {showProducts && (
        <div className="grid grid-cols-3 gap-1.5 border-t border-line px-3 pb-3 pt-3">
          {products.map((product: any) => (
            <StorefrontProductCard key={product.id} product={product} company={company} />
          ))}
        </div>
      )}

      {/* Footer: engagement + link loja */}
      <div className="border-t border-line px-4 py-2 flex items-center justify-between gap-3">
        <PostEngagement post={post} accent="magenta" compact />
        <Link
          to={`/companies/${company?.slug}`}
          className="shrink-0 flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-mute hover:text-magenta transition-colors"
        >
          <Store size={11} />
          Ver loja
          <ArrowUpRight size={11} />
        </Link>
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
