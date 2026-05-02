import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
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

  if (!company) {
    return null;
  }

  const isOwner = currentUser?.id === company.ownerId;
  const totalProducts = company._count?.products ?? company.products?.length ?? 0;
  const totalPosts = company._count?.posts ?? company.posts?.length ?? 0;

  return (
    <div className="space-y-5 px-4 pb-6 lg:px-0">
      <Card className="overflow-hidden border-blue-100/80 p-0 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
        <div className="relative h-40 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 lg:h-56">
          {company.coverUrl ? (
            <img src={company.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
        </div>

        <div className="px-4 pb-5 pt-4 lg:px-8 lg:pb-8 lg:pt-0">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-10 inline-flex lg:-mt-14">
                <div className="rounded-[28px] border-4 border-white bg-white shadow-lg shadow-blue-900/10">
                  <Avatar
                    src={company.logoUrl}
                    name={company.name}
                    size="lg"
                    className="h-20 w-20 text-2xl lg:h-24 lg:w-24 lg:text-3xl"
                  />
                </div>
              </div>

              <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[1.35rem] font-bold leading-tight text-gray-900 lg:text-[2rem]">
                    {company.name}
                  </h1>
                  {company.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      <BadgeCheck size={14} />
                      Verificada
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      company.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {company.isActive ? 'Ativa' : 'Pausada'}
                  </span>
                </div>

                {company.category ? (
                  <p className="text-sm text-gray-500 lg:text-base">{company.category}</p>
                ) : null}

                <div className="space-y-1 text-sm text-gray-600">
                  {(company.address || company.city) && (
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span>
                        {company.address && company.city
                          ? `${company.address}, ${company.city}`
                          : company.address || company.city}
                      </span>
                    </p>
                  )}
                  {company.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="shrink-0" />
                      {company.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:mt-0 lg:w-[19rem] lg:shrink-0">
              {isOwner ? (
                <Link to="/companies/manage" className="block">
                  <Button fullWidth className="rounded-xl py-3">
                    <Settings2 size={16} />
                    <span className="ml-2">Gerenciar empresa</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  fullWidth
                  className="rounded-xl py-3"
                  onClick={() => startChatMutation.mutate()}
                  isLoading={startChatMutation.isPending}
                >
                  Enviar mensagem
                </Button>
              )}

              {company.owner?.id ? (
                <Link to={`/profile/${company.owner.id}`} className="block">
                  <Button variant="secondary" fullWidth className="rounded-xl py-3">
                    <ExternalLink size={16} />
                    <span className="ml-2">Ver perfil do responsavel</span>
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:mt-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3.5 lg:px-4 lg:py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 lg:text-base">
                {company.isActive ? 'Perfil publico ativo' : 'Perfil pausado'}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3.5 lg:px-4 lg:py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Produtos</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 lg:text-base">
                <Package2 size={16} className="text-gray-400" />
                {totalProducts} item(ns)
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3.5 lg:px-4 lg:py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Publicacoes
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 lg:text-base">
                <Store size={16} className="text-gray-400" />
                {totalPosts} publicacao(oes)
              </p>
            </div>
          </div>

          {company.description ? (
            <p className="mt-5 text-sm leading-relaxed text-gray-700 lg:mt-6 lg:text-base">
              {company.description}
            </p>
          ) : null}
        </div>
      </Card>

      {company.products?.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-gray-900">Catalogo</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {company.products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden rounded-[28px] p-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100 text-xs text-gray-300">
                    sem foto
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                        product.isAvailable
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.isAvailable ? 'Disponivel' : 'Indisponivel'}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-600">{product.description}</p>
                  )}
                  {product.price != null && (
                    <p className="text-sm font-bold text-blue-600">
                      {formatCurrency(Number(product.price))}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {company.posts?.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-gray-900">Publicacoes da empresa</h2>
          <div className="grid gap-3 xl:grid-cols-2">
            {company.posts.map((post: any) => (
              <Card key={post.id} className="space-y-4 rounded-[28px] p-4">
                {post.promotion ? (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Sparkles size={13} />
                    Publicacao impulsionada
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {post.media?.length ?? 0} arquivo(s)
                  </span>
                </div>

                {post.promotion?.headline ? (
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {post.promotion.headline}
                    </p>
                    {post.promotion.subtitle ? (
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {post.promotion.subtitle}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {post.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {post.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Publicacao sem texto.</p>
                )}

                <PostMediaGallery media={post.media ?? []} />

                {post.promotion?.kind === PromotionKind.COMPANY_PRODUCTS &&
                post.promotion.products?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {post.promotion.products.map((item: any) => {
                      const product = item.product;

                      if (!product) return null;

                      return (
                        <div
                          key={product.id}
                          className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-32 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-32 items-center justify-center text-gray-300">
                              <Package2 size={24} />
                            </div>
                          )}
                          <div className="space-y-1 p-3">
                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                              {product.name}
                            </p>
                            {product.description ? (
                              <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                                {product.description}
                              </p>
                            ) : null}
                            {product.price != null ? (
                              <p className="text-sm font-bold text-blue-600">
                                {formatCurrency(Number(product.price))}
                              </p>
                            ) : (
                              <p className="text-xs font-medium text-gray-500">
                                Consulte disponibilidade
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <PostEngagement post={post} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
