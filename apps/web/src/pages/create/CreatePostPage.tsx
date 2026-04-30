import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@palmital/ui';
import { PostType, PromotionKind } from '@palmital/types';
import { BriefcaseBusiness, Megaphone, Package2, Sparkles, Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from '../../components/shared/ImageUploader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type TabType = 'social' | 'classified' | 'business' | 'promotion';
type PromotionMode = 'professional' | 'company-profile' | 'company-products';

export function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabType>('social');
  const [content, setContent] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [promotionMode, setPromotionMode] = useState<PromotionMode>('professional');
  const [promotion, setPromotion] = useState({
    headline: '',
    subtitle: '',
    city: '',
    serviceArea: '',
    highlights: '',
    productIds: [] as string[],
  });
  const [classified, setClassified] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    isFree: false,
  });

  const { data: myCompany } = useQuery({
    queryKey: ['my-company'],
    enabled: currentUser?.role === 'BUSINESS_OWNER',
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get('/companies/me');
        return data as any;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const availableTabs: TabType[] = myCompany
    ? ['social', 'classified', 'business', 'promotion']
    : ['social', 'classified', 'promotion'];

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      addToast('Publicado com sucesso!', 'success');
      navigate('/feed');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Erro ao publicar', 'error');
    },
  });

  function resetProductSelection() {
    setPromotion((state) => ({ ...state, productIds: [] }));
  }

  function toggleProduct(productId: string) {
    setPromotion((state) => {
      const exists = state.productIds.includes(productId);
      if (exists) {
        return { ...state, productIds: state.productIds.filter((id) => id !== productId) };
      }

      if (state.productIds.length >= 3) {
        addToast('Selecione ate 3 produtos por impulsionamento', 'error');
        return state;
      }

      return { ...state, productIds: [...state.productIds, productId] };
    });
  }

  function getPromotionKind() {
    if (promotionMode === 'company-profile') {
      return PromotionKind.COMPANY_PROFILE;
    }

    if (promotionMode === 'company-products') {
      return PromotionKind.COMPANY_PRODUCTS;
    }

    return PromotionKind.PROFESSIONAL;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isMediaUploading) {
      addToast('Aguarde o envio das midias terminar antes de publicar', 'error');
      return;
    }

    if (tab === 'social' || tab === 'business') {
      if (!content.trim() && mediaIds.length === 0) {
        addToast('Escreva algo ou adicione uma foto', 'error');
        return;
      }

      mutation.mutate({
        type: tab === 'business' ? PostType.BUSINESS : PostType.SOCIAL,
        content,
        mediaIds,
        companyId: tab === 'business' ? myCompany?.id : undefined,
      });
      return;
    }

    if (tab === 'promotion') {
      if (!promotion.headline.trim()) {
        addToast('Defina um titulo para o impulsionamento', 'error');
        return;
      }

      if ((promotionMode === 'company-profile' || promotionMode === 'company-products') && !myCompany?.id) {
        addToast('Crie sua empresa antes de impulsionar esse formato', 'error');
        return;
      }

      if (promotionMode === 'company-products' && promotion.productIds.length === 0) {
        addToast('Selecione ao menos um produto para a vitrine impulsionada', 'error');
        return;
      }

      mutation.mutate({
        type: PostType.PROMOTION,
        content,
        companyId:
          promotionMode === 'professional'
            ? undefined
            : myCompany?.id,
        promotion: {
          kind: getPromotionKind(),
          headline: promotion.headline,
          subtitle: promotion.subtitle || undefined,
          city: promotion.city || undefined,
          serviceArea: promotion.serviceArea || undefined,
          highlights: promotion.highlights
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 4),
          productIds: promotionMode === 'company-products' ? promotion.productIds : undefined,
        },
      });
      return;
    }

    if (!classified.title || !classified.description) {
      addToast('Preencha titulo e descricao', 'error');
      return;
    }

    mutation.mutate({
      type: PostType.CLASSIFIED,
      content,
      mediaIds,
      classified: {
        ...classified,
        price: classified.isFree ? undefined : classified.price ? Number(classified.price) : undefined,
      },
    });
  }

  return (
    <div className="px-4 pb-6">
      <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
        <div className="mb-4 flex border-b">
          {availableTabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
                tab === item ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {item === 'social'
                ? 'Publicacao'
                : item === 'classified'
                  ? 'Classificado'
                  : item === 'business'
                    ? 'Empresa'
                    : 'Impulsionar'}
            </button>
          ))}
        </div>

        {tab === 'business' && myCompany ? (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Esta publicacao sera exibida como conteudo oficial da empresa <strong>{myCompany.name}</strong>.
          </div>
        ) : null}

        {tab === 'promotion' ? (
          <div className="mb-4 rounded-[26px] border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_100%)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              <Sparkles size={14} />
              Impulsionamento
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Crie um formato proprio para destacar profissionais, perfis de loja ou uma pequena vitrine de produtos.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'promotion' && (
            <div className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setPromotionMode('professional');
                    resetProductSelection();
                  }}
                  className={`rounded-[22px] border p-4 text-left transition-all ${
                    promotionMode === 'professional'
                      ? 'border-amber-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-white/70'
                  }`}
                >
                  <BriefcaseBusiness size={18} className="text-amber-600" />
                  <p className="mt-3 font-semibold text-slate-900">Profissional liberal</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Eletricista, pintor, tecnico, manicure e afins.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPromotionMode('company-profile');
                    resetProductSelection();
                  }}
                  disabled={!myCompany}
                  className={`rounded-[22px] border p-4 text-left transition-all ${
                    promotionMode === 'company-profile'
                      ? 'border-blue-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-white/70'
                  } ${!myCompany ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Store size={18} className="text-blue-600" />
                  <p className="mt-3 font-semibold text-slate-900">Perfil da loja</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Destaque institucional da empresa sem depender de produtos.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPromotionMode('company-products')}
                  disabled={!myCompany}
                  className={`rounded-[22px] border p-4 text-left transition-all ${
                    promotionMode === 'company-products'
                      ? 'border-violet-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-white/70'
                  } ${!myCompany ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Package2 size={18} className="text-violet-600" />
                  <p className="mt-3 font-semibold text-slate-900">Vitrine de produtos</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Mostre um ou mais produtos como impulsionamento comercial.</p>
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Titulo do impulsionamento *"
                  value={promotion.headline}
                  onChange={(e) => setPromotion((state) => ({ ...state, headline: e.target.value }))}
                  placeholder="Ex.: Eletricista residencial em Palmital"
                  required
                />
                <Input
                  label="Cidade"
                  value={promotion.city}
                  onChange={(e) => setPromotion((state) => ({ ...state, city: e.target.value }))}
                  placeholder="Palmital"
                />
                <Input
                  label="Subtitulo"
                  value={promotion.subtitle}
                  onChange={(e) => setPromotion((state) => ({ ...state, subtitle: e.target.value }))}
                  placeholder="Atendimento rapido, orcamento e suporte local"
                />
                <Input
                  label="Area de atendimento"
                  value={promotion.serviceArea}
                  onChange={(e) => setPromotion((state) => ({ ...state, serviceArea: e.target.value }))}
                  placeholder="Palmital, Ourinhos e regiao"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Destaques"
                    value={promotion.highlights}
                    onChange={(e) => setPromotion((state) => ({ ...state, highlights: e.target.value }))}
                    placeholder="Digite separado por virgula: plantao, instalacao, revisao"
                  />
                </div>
              </div>

              {promotionMode === 'company-products' && myCompany?.products?.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Produtos destacados</p>
                      <p className="text-sm text-slate-500">Selecione de 1 a 3 produtos para o card de vitrine.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      <Megaphone size={12} />
                      {promotion.productIds.length}/3 selecionados
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {myCompany.products.map((product: any) => {
                      const isSelected = promotion.productIds.includes(product.id);

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={`flex items-center gap-3 rounded-[22px] border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-violet-300 bg-white shadow-sm'
                              : 'border-slate-200 bg-white/80'
                          }`}
                        >
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">{product.name}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {product.description || 'Sem descricao cadastrada'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              tab === 'classified'
                ? 'Descricao do anuncio (opcional)'
                : tab === 'business'
                  ? 'Compartilhe novidades, promocoes ou atualizacoes da sua empresa'
                  : tab === 'promotion'
                    ? 'Escreva um apoio opcional para o card impulsionado'
                    : 'O que esta acontecendo em Palmital?'
            }
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {tab === 'classified' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Titulo do anuncio *"
                value={classified.title}
                onChange={(e) => setClassified((c) => ({ ...c, title: e.target.value }))}
                required
                maxLength={200}
              />
              <Input
                label="Cidade"
                value={classified.city}
                onChange={(e) => setClassified((c) => ({ ...c, city: e.target.value }))}
                placeholder="Palmital"
              />
              <div className="md:col-span-2">
                <Input
                  label="Descricao *"
                  value={classified.description}
                  onChange={(e) => setClassified((c) => ({ ...c, description: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={classified.isFree}
                  onChange={(e) => setClassified((c) => ({ ...c, isFree: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isFree" className="text-sm text-gray-700">
                  E gratis
                </label>
              </div>
              {!classified.isFree && (
                <Input
                  label="Preco (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={classified.price}
                  onChange={(e) => setClassified((c) => ({ ...c, price: e.target.value }))}
                />
              )}
            </div>
          )}

          <ImageUploader
            onUpload={(id) => setMediaIds((ids) => [...ids, id])}
            onRemove={(id) => setMediaIds((ids) => ids.filter((mediaId) => mediaId !== id))}
            onUploadingChange={setIsMediaUploading}
            maxFiles={4}
          />

          <Button type="submit" fullWidth isLoading={mutation.isPending} disabled={isMediaUploading}>
            Publicar
          </Button>
        </form>
      </div>
    </div>
  );
}
