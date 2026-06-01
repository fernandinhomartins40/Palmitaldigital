import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { formatCurrency } from '@palmital/utils';
import { PromotionKind } from '@palmital/types';
import { api } from '../../services/api';
import { companiesApi, type StoreProduct } from '../../services/companiesApi';
import { useCompanyCartStore } from '../../store/companyCartStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { PostEngagement } from '../../components/feed/PostEngagement';
import { PostMediaGallery } from '../../components/feed/PostMediaGallery';
import {
  BadgeCheck,
  Minus,
  Plus,
  MapPin,
  MessageCircle,
  Package2,
  Phone,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const WHATSAPP_DIGITS = (raw?: string | null) => (raw ? raw.replace(/\D/g, '') : '');

function buildWhatsAppLink(company: any, message: string) {
  const digits = WHATSAPP_DIGITS(company.whatsapp || company.phone);
  if (!digits) return null;
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function ProductCard({
  product,
  company,
  canSell,
  onAdd,
  onContact,
}: {
  product: StoreProduct;
  company: any;
  canSell: boolean;
  onAdd: () => void;
  onContact: () => void;
}) {
  return (
    <div className="group glass shape-signature flex flex-col overflow-hidden">
      <div className="relative aspect-square bg-ink/5 dark:bg-white/5">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-mute">
            <Package2 size={32} strokeWidth={1.2} />
          </div>
        )}
        {product.isFeatured && (
          <span className="chip chip-magenta absolute left-2 top-2">
            <Sparkles size={10} />
            DESTAQUE
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 font-display text-sm font-bold leading-tight text-ink">
          {product.name}
        </p>
        {product.description && (
          <p className="line-clamp-2 text-xs leading-4 text-mute">{product.description}</p>
        )}
        <div className="mt-auto pt-2">
          {product.price != null ? (
            <p className="font-mono text-base font-bold text-ink">
              {formatCurrency(Number(product.price))}
            </p>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">A consultar</p>
          )}

          {canSell && product.price != null ? (
            <button
              onClick={onAdd}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-cobalt px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={15} strokeWidth={2.5} />
              Adicionar
            </button>
          ) : (
            <button
              onClick={onContact}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-ink/[0.02] px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-cobalt hover:text-white dark:bg-white/[0.04]"
            >
              <MessageCircle size={15} strokeWidth={2.2} />
              Tenho interesse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutSheet({
  company,
  onClose,
}: {
  company: any;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const cart = useCompanyCartStore();
  const [name, setName] = useState(currentUser?.profile?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const checkout = useMutation({
    mutationFn: () =>
      companiesApi.createOrder({
        companyId: company.id,
        items: cart.items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
        customerName: name.trim(),
        customerPhone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (res) => {
      cart.clearCart();
      onClose();
      navigate(`/companies/order/${res.data.id}`);
    },
    onError: () => addToast('Erro ao enviar pedido', 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="glass-strong max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Seu pedido</h3>
          <button onClick={onClose} className="text-mute hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/5">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-mute">
                    <Package2 size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.product.name}</p>
                <p className="font-mono text-xs text-mute">
                  {formatCurrency((item.product.price ?? 0) * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink"
                >
                  {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                </button>
                <span className="w-5 text-center font-mono text-sm font-bold text-ink">
                  {item.quantity}
                </span>
                <button
                  onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute">Total</span>
          <span className="font-display text-xl font-bold text-ink">{formatCurrency(cart.total())}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-mute">
              Seu nome *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink/[0.02] px-3 py-2.5 text-sm text-ink outline-none focus:border-cobalt dark:bg-white/[0.04]"
              placeholder="Como a loja deve te chamar"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-mute">
              Telefone / WhatsApp
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink/[0.02] px-3 py-2.5 text-sm text-ink outline-none focus:border-cobalt dark:bg-white/[0.04]"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-mute">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-line bg-ink/[0.02] px-3 py-2.5 text-sm text-ink outline-none focus:border-cobalt dark:bg-white/[0.04]"
              placeholder="Tamanho, cor, ponto de entrega..."
            />
          </div>
        </div>

        <Button
          fullWidth
          className="mt-4"
          disabled={!name.trim() || cart.items.length === 0}
          isLoading={checkout.isPending}
          onClick={() => checkout.mutate()}
        >
          <ShoppingBag size={16} />
          <span className="ml-2">Enviar pedido</span>
        </Button>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-mute">
          Pagamento via PIX combinado com a loja
        </p>
      </div>
    </div>
  );
}

export function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const cart = useCompanyCartStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', slug],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${slug}`);
      return data as any;
    },
  });

  const startChatMutation = useMutation({
    mutationFn: () => api.post('/chat/conversations', { recipientId: company.ownerId }),
    onSuccess: (res) => navigate(`/chat/${res.data.id}`),
    onError: () => addToast('Erro ao iniciar conversa', 'error'),
  });

  const products: StoreProduct[] = company?.products ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, activeCategory]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!company) return null;

  const isOwner = currentUser?.id === company.ownerId;
  const canSell = (company.sellMode === 'CART' || company.sellMode === 'BOTH') && !isOwner;
  const totalProducts = company._count?.products ?? products.length;
  const cartActiveHere = cart.companyId === company.id && cart.items.length > 0;

  const contactProduct = (product: StoreProduct) => {
    const message = `Olá! Tenho interesse no produto "${product.name}"${
      product.price != null ? ` (${formatCurrency(Number(product.price))})` : ''
    } da ${company.name}.`;
    const link = buildWhatsAppLink(company, message);
    if (link) {
      window.open(link, '_blank');
    } else if (company.ownerId) {
      startChatMutation.mutate();
    } else {
      addToast('Loja sem contato cadastrado', 'error');
    }
  };

  const addProduct = (product: StoreProduct) => {
    cart.addItem(company.id, company.name, company.slug, product, 1);
    addToast(`${product.name} adicionado`, 'success');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* ─── Storefront header ─── */}
      <div className="glass shape-signature-lg overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-ink/[0.04] lg:h-56 dark:bg-white/[0.04]">
          {company.coverUrl ? (
            <img src={company.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 30% 50%, #3D5AFE 0%, transparent 55%), radial-gradient(circle at 70% 50%, #5EEAD4 0%, transparent 55%)',
              }}
            />
          )}
        </div>

        <div className="px-5 pb-6 pt-4 lg:px-8 lg:pb-8">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-12 inline-flex lg:-mt-16">
                <div className="bg-surface p-1 dark:bg-canvas" style={{ borderRadius: '28px 28px 8px 28px' }}>
                  <div className="overflow-hidden" style={{ borderRadius: '24px 24px 4px 24px' }}>
                    <Avatar
                      src={company.logoUrl}
                      name={company.name}
                      size="xl"
                      accent="cobalt"
                      className="!h-24 !w-24 !rounded-none !ring-0 lg:!h-28 lg:!w-28 lg:!text-3xl"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink lg:text-[2rem]">
                    {company.name}
                  </h1>
                  {company.isVerified && (
                    <span className="chip chip-cobalt">
                      <BadgeCheck size={11} />
                      VERIFICADA
                    </span>
                  )}
                  {(company.sellMode === 'CART' || company.sellMode === 'BOTH') && (
                    <span className="chip chip-mint">
                      <ShoppingBag size={11} />
                      LOJA ONLINE
                    </span>
                  )}
                </div>

                {company.category && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                    {company.category}
                  </p>
                )}

                <div className="space-y-1 font-mono text-[11px] uppercase tracking-wider text-mute">
                  {(company.address || company.city) && (
                    <p className="flex items-start gap-2">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span>
                        {company.address && company.city
                          ? `${company.address}, ${company.city}`
                          : company.address || company.city}
                      </span>
                    </p>
                  )}
                  {(company.whatsapp || company.phone) && (
                    <p className="flex items-center gap-2">
                      <Phone size={11} className="shrink-0" />
                      {company.whatsapp || company.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 lg:mt-0 lg:w-[19rem] lg:shrink-0">
              {isOwner ? (
                <Link to="/companies/manage">
                  <Button fullWidth>
                    <Settings2 size={16} />
                    <span className="ml-2">Gerenciar loja</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  fullWidth
                  variant="glass"
                  onClick={() => {
                    const link = buildWhatsAppLink(company, `Olá! Vim pela Palmital Digital, sobre a ${company.name}.`);
                    if (link) window.open(link, '_blank');
                    else startChatMutation.mutate();
                  }}
                  isLoading={startChatMutation.isPending}
                >
                  <MessageCircle size={16} />
                  <span className="ml-2">Falar com a loja</span>
                </Button>
              )}
            </div>
          </div>

          {company.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink lg:mt-6">{company.description}</p>
          )}
        </div>
      </div>

      {/* ─── Catalog / storefront ─── */}
      {products.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">
              Vitrine
              <span className="ml-2 font-mono text-xs font-normal text-mute">{totalProducts} itens</span>
            </h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full rounded-2xl border border-line bg-ink/[0.02] py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-cobalt dark:bg-white/[0.04]"
            />
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`chip shrink-0 transition-colors ${
                    activeCategory === cat ? 'chip-cobalt' : 'border border-line'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  company={company}
                  canSell={canSell}
                  onAdd={() => addProduct(product)}
                  onContact={() => contactProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="glass shape-signature p-8 text-center">
              <Package2 size={28} className="mx-auto mb-2 text-mute" strokeWidth={1.2} />
              <p className="text-sm text-mute">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Posts ─── */}
      {company.posts?.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-ink">Publicações</h2>
          <div className="grid gap-3 xl:grid-cols-2">
            {company.posts.map((post: any) => (
              <div key={post.id} className="glass shape-signature space-y-4 p-5">
                {post.promotion && (
                  <span className="chip chip-magenta">
                    <Sparkles size={11} />
                    IMPULSIONADO
                  </span>
                )}

                {post.promotion?.headline && (
                  <div>
                    <p className="font-display text-base font-bold text-ink">{post.promotion.headline}</p>
                    {post.promotion.subtitle && (
                      <p className="mt-1 text-sm leading-relaxed text-mute">{post.promotion.subtitle}</p>
                    )}
                  </div>
                )}

                {post.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</p>
                ) : (
                  <p className="text-sm text-mute">Publicação sem texto.</p>
                )}

                <PostMediaGallery media={post.media ?? []} />

                {post.promotion?.kind === PromotionKind.COMPANY_PRODUCTS &&
                  post.promotion.products?.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {post.promotion.products.map((item: any) => {
                        const product = item.product;
                        if (!product) return null;
                        return (
                          <div
                            key={product.id}
                            className="overflow-hidden rounded-2xl border border-line bg-ink/[0.02] dark:bg-white/[0.04]"
                          >
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-32 w-full object-cover" />
                            ) : (
                              <div className="flex h-32 items-center justify-center text-mute">
                                <Package2 size={24} />
                              </div>
                            )}
                            <div className="space-y-1 p-3">
                              <p className="line-clamp-2 font-display text-sm font-bold text-ink">{product.name}</p>
                              {product.price != null ? (
                                <p className="font-mono text-sm font-bold text-ink">
                                  {formatCurrency(Number(product.price))}
                                </p>
                              ) : (
                                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">A consultar</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                <PostEngagement post={post} accent="cobalt" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Floating cart bar ─── */}
      {cartActiveHere && !showCheckout && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:w-96">
          <button
            onClick={() => setShowCheckout(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-cobalt px-5 py-3.5 text-white shadow-lg transition-opacity hover:opacity-95"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingBag size={18} />
              {cart.itemCount()} {cart.itemCount() === 1 ? 'item' : 'itens'}
            </span>
            <span className="font-display font-bold">{formatCurrency(cart.total())}</span>
          </button>
        </div>
      )}

      {showCheckout && <CheckoutSheet company={company} onClose={() => setShowCheckout(false)} />}
    </div>
  );
}
