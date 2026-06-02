import { PromotionKind } from '@palmital/types';
import { Avatar } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  MapPin,
  MessageCircle,
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

function StorefrontProductCard({ product, company }: { product: any; company: any }) {
  const cart = useCompanyCartStore();
  const addToast = useUIStore((s) => s.addToast);
  const canSell = company?.sellMode === 'CART' || company?.sellMode === 'BOTH';
  const hasPrice = product.price != null;

  const handleAdd = () => {
    cart.addItem(company.id, company.name, company.slug, product, 1);
    addToast(`${product.name} adicionado`, 'success');
  };

  const handleContact = () => {
    const message = `Olá! Tenho interesse no produto "${product.name}"${
      hasPrice ? ` (${formatCurrency(Number(product.price))})` : ''
    } da ${company?.name}.`;
    const link = companyWhatsAppLink(company, message);
    if (link) window.open(link, '_blank');
  };

  return (
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
        {hasPrice && (
          <p className="font-mono text-xs font-bold text-ink">{formatCurrency(Number(product.price))}</p>
        )}
        {canSell && hasPrice ? (
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-cobalt px-2 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={11} strokeWidth={2.5} />
            Adicionar
          </button>
        ) : (
          <button
            onClick={handleContact}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-ink transition-colors hover:bg-magenta hover:text-white"
          >
            <MessageCircle size={11} strokeWidth={2.2} />
            Interesse
          </button>
        )}
      </div>
    </div>
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
