import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { formatCurrency } from '@palmital/utils';
import { PromotionKind } from '@palmital/types';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { PostEngagement } from '../../components/feed/PostEngagement';
import { PostMediaGallery } from '../../components/feed/PostMediaGallery';
import {
  BadgeCheck,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package2,
  Phone,
  Settings2,
  Sparkles,
  Store,
} from 'lucide-react';

export function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!company) return null;

  const isOwner = currentUser?.id === company.ownerId;
  const totalProducts = company._count?.products ?? company.products?.length ?? 0;
  const totalPosts = company._count?.posts ?? company.posts?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="glass shape-signature-lg overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-ink/[0.04] lg:h-56 dark:bg-white/[0.04]">
          {company.coverUrl ? (
            <img src={company.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 50%, #3D5AFE 0%, transparent 55%), radial-gradient(circle at 70% 50%, #5EEAD4 0%, transparent 55%)' }} />
          )}
        </div>

        <div className="px-5 pb-6 pt-4 lg:px-8 lg:pb-8">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-12 inline-flex lg:-mt-16">
                <div
                  className="bg-surface p-1 dark:bg-canvas"
                  style={{ borderRadius: '28px 28px 8px 28px' }}
                >
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
                  <span className={company.isActive ? 'chip chip-mint' : 'chip chip-amber'}>
                    {company.isActive ? 'ATIVA' : 'PAUSADA'}
                  </span>
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
                  {company.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={11} className="shrink-0" />
                      {company.phone}
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
                    <span className="ml-2">Gerenciar empresa</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  fullWidth
                  onClick={() => startChatMutation.mutate()}
                  isLoading={startChatMutation.isPending}
                >
                  <MessageCircle size={16} />
                  <span className="ml-2">Enviar mensagem</span>
                </Button>
              )}

              {company.owner?.id && (
                <Link to={`/profile/${company.owner.id}`}>
                  <Button variant="glass" fullWidth>
                    <ExternalLink size={15} />
                    <span className="ml-2">Ver responsável</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 lg:mt-7 lg:grid-cols-3">
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-cobalt" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Status</p>
              <p className="mt-1 font-display text-sm font-bold text-ink">
                {company.isActive ? 'Perfil público' : 'Perfil pausado'}
              </p>
            </div>
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-citrus" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Produtos</p>
              <p className="mt-1 flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Package2 size={14} className="text-mute" />
                {totalProducts}
              </p>
            </div>
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-coral" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Publicações</p>
              <p className="mt-1 flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Store size={14} className="text-mute" />
                {totalPosts}
              </p>
            </div>
          </div>

          {company.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink lg:mt-6">
              {company.description}
            </p>
          )}
        </div>
      </div>

      {company.products?.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-ink">Catálogo</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {company.products.map((product: any) => (
              <div key={product.id} className="glass shape-signature overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-ink/5 font-mono text-[10px] uppercase text-mute dark:bg-white/5">
                    sem foto
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm font-bold text-ink">{product.name}</p>
                    <span className={product.isAvailable ? 'chip chip-mint' : 'chip'}>
                      {product.isAvailable ? 'OK' : 'INDISP.'}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-xs leading-5 text-mute">{product.description}</p>
                  )}
                  {product.price != null && (
                    <p className="font-mono text-sm font-bold text-ink">
                      {formatCurrency(Number(product.price))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

                <div className="flex items-center justify-between gap-3">
                  <span className="chip">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
                    {post.media?.length ?? 0} arquivos
                  </span>
                </div>

                {post.promotion?.headline && (
                  <div>
                    <p className="font-display text-base font-bold text-ink">
                      {post.promotion.headline}
                    </p>
                    {post.promotion.subtitle && (
                      <p className="mt-1 text-sm leading-relaxed text-mute">
                        {post.promotion.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {post.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {post.content}
                  </p>
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
                              <p className="line-clamp-2 font-display text-sm font-bold text-ink">
                                {product.name}
                              </p>
                              {product.description && (
                                <p className="line-clamp-2 text-xs leading-5 text-mute">
                                  {product.description}
                                </p>
                              )}
                              {product.price != null ? (
                                <p className="font-mono text-sm font-bold text-ink">
                                  {formatCurrency(Number(product.price))}
                                </p>
                              ) : (
                                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                                  A consultar
                                </p>
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
    </div>
  );
}
