import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
import { formatCurrency } from '@palmital/utils';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { BadgeCheck, ExternalLink, MapPin, Phone, Settings2 } from 'lucide-react';

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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!company) return null;

  const isOwner = currentUser?.id === company.ownerId;

  return (
    <div className="space-y-5 px-4 pb-6 lg:px-0">
      <Card className="overflow-hidden p-0">
        <div className="relative h-40 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 lg:h-56">
          {company.coverUrl ? (
            <img src={company.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
        </div>

        <div className="px-4 pb-5 lg:px-8 lg:pb-8">
          <div className="-mt-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl border-4 border-white bg-white shadow-sm">
                <Avatar src={company.logoUrl} name={company.name} size="lg" className="h-20 w-20 text-2xl lg:h-24 lg:w-24 lg:text-3xl" />
              </div>
              <div className="pt-10 lg:pt-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 lg:text-3xl">{company.name}</h1>
                  {company.isVerified && <BadgeCheck size={18} className="text-blue-500" />}
                </div>
                {company.category && <p className="text-sm text-gray-500">{company.category}</p>}
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {company.city && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      {company.address ? `${company.address}, ${company.city}` : company.city}
                    </p>
                  )}
                  {company.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} />
                      {company.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-[18rem]">
              {isOwner ? (
                <Link to="/companies/manage" className="block">
                  <Button fullWidth>
                    <Settings2 size={16} />
                    <span className="ml-2">Gerenciar empresa</span>
                  </Button>
                </Link>
              ) : (
                <Button fullWidth onClick={() => startChatMutation.mutate()} isLoading={startChatMutation.isPending}>
                  Enviar mensagem
                </Button>
              )}

              {company.owner?.id && (
                <Link to={`/profile/${company.owner.id}`} className="block">
                  <Button variant="secondary" fullWidth>
                    <ExternalLink size={16} />
                    <span className="ml-2">Ver perfil do responsavel</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {company.description && (
            <p className="mt-5 text-sm leading-relaxed text-gray-700 lg:text-base">{company.description}</p>
          )}
        </div>
      </Card>

      {company.products?.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-gray-900">Catalogo</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {company.products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden rounded-[28px] p-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100 text-xs text-gray-300">sem foto</div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${product.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.isAvailable ? 'Disponivel' : 'Indisponivel'}
                    </span>
                  </div>
                  {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
                  {product.price != null && (
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(Number(product.price))}</p>
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
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs text-gray-400">{post.media?.length ?? 0} arquivo(s)</span>
                </div>

                {post.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {post.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Publicacao sem texto.</p>
                )}

                {post.media?.length ? (
                  <div className={`grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media.slice(0, 4).map((media: any) => (
                      <img
                        key={media.id}
                        src={media.url}
                        alt=""
                        className="aspect-square w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
