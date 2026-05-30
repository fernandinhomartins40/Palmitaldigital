import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@palmital/ui';
import { PostType, PromotionKind } from '@palmital/types';
import { BriefcaseBusiness, Megaphone, Package2, Sparkles, Store } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploader, type ImageUploaderHandle } from '../../components/shared/ImageUploader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type TabType = 'social' | 'classified' | 'business' | 'promotion';
type PromotionMode = 'professional' | 'company-profile' | 'company-products';

const tabAccent: Record<TabType, { halo: string; bg: string; chip: string }> = {
  social: { halo: 'halo-coral', bg: 'bg-coral', chip: 'chip-coral' },
  classified: { halo: 'halo-citrus', bg: 'bg-citrus', chip: 'chip-citrus' },
  business: { halo: 'halo-cobalt', bg: 'bg-cobalt', chip: 'chip-cobalt' },
  promotion: { halo: 'halo-magenta', bg: 'bg-magenta', chip: 'chip-magenta' },
};

const tabLabels: Record<TabType, string> = {
  social: 'Publicação',
  classified: 'Classificado',
  business: 'Empresa',
  promotion: 'Impulsionar',
};

export function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const [tab, setTab] = useState<TabType>('social');
  const [content, setContent] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [isFinalizingPost, setIsFinalizingPost] = useState(false);
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
        if (error.response?.status === 404) return null;
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
      addToast('Publicado!', 'success');
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
        addToast('Selecione até 3 produtos', 'error');
        return state;
      }
      return { ...state, productIds: [...state.productIds, productId] };
    });
  }

  function getPromotionKind() {
    if (promotionMode === 'company-profile') return PromotionKind.COMPANY_PROFILE;
    if (promotionMode === 'company-products') return PromotionKind.COMPANY_PRODUCTS;
    return PromotionKind.PROFESSIONAL;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsFinalizingPost(true);

    let finalizedMediaIds = mediaIds;

    try {
      finalizedMediaIds = uploaderRef.current
        ? await uploaderRef.current.finalizeUploads()
        : mediaIds;
    } catch (error: any) {
      addToast(error.message || 'Finalize os uploads antes de publicar', 'error');
      setIsFinalizingPost(false);
      return;
    }

    if (tab === 'social' || tab === 'business') {
      if (!content.trim() && finalizedMediaIds.length === 0) {
        addToast('Escreva algo ou adicione uma foto', 'error');
        setIsFinalizingPost(false);
        return;
      }

      try {
        await mutation.mutateAsync({
          type: tab === 'business' ? PostType.BUSINESS : PostType.SOCIAL,
          content,
          mediaIds: finalizedMediaIds,
          companyId: tab === 'business' ? myCompany?.id : undefined,
        });
      } finally {
        setIsFinalizingPost(false);
      }
      return;
    }

    if (tab === 'promotion') {
      if (!promotion.headline.trim()) {
        addToast('Defina um título', 'error');
        setIsFinalizingPost(false);
        return;
      }
      if ((promotionMode === 'company-profile' || promotionMode === 'company-products') && !myCompany?.id) {
        addToast('Crie sua empresa antes', 'error');
        setIsFinalizingPost(false);
        return;
      }
      if (promotionMode === 'company-products' && promotion.productIds.length === 0) {
        addToast('Selecione ao menos um produto', 'error');
        setIsFinalizingPost(false);
        return;
      }

      try {
        await mutation.mutateAsync({
          type: PostType.PROMOTION,
          content,
          mediaIds: finalizedMediaIds,
          companyId: promotionMode === 'professional' ? undefined : myCompany?.id,
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
      } finally {
        setIsFinalizingPost(false);
      }
      return;
    }

    if (!classified.title || !classified.description) {
      addToast('Preencha título e descrição', 'error');
      setIsFinalizingPost(false);
      return;
    }

    try {
      await mutation.mutateAsync({
        type: PostType.CLASSIFIED,
        content,
        mediaIds: finalizedMediaIds,
        classified: {
          ...classified,
          price: classified.isFree ? undefined : classified.price ? Number(classified.price) : undefined,
        },
      });
    } finally {
      setIsFinalizingPost(false);
    }
  }

  const currentAccent = tabAccent[tab];

  return (
    <div className="space-y-4">
      <div className="glass shape-signature-lg p-5 lg:p-6">
        {/* Tabs */}
        <div className="glass-scrollbar -mx-1 mb-5 flex gap-1 overflow-x-auto">
          {availableTabs.map((item) => {
            const isActive = tab === item;
            const accent = tabAccent[item];
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`relative shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? `halo ${accent.halo} ${accent.bg} ${item === 'classified' ? 'text-ink' : 'text-white'}`
                    : 'text-mute hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/[0.04]'
                }`}
              >
                {tabLabels[item]}
              </button>
            );
          })}
        </div>

        {tab === 'business' && myCompany && (
          <div className="mb-4 rounded-2xl border border-cobalt/30 bg-cobalt/[0.05] px-4 py-3 text-sm text-ink">
            <span className="chip chip-cobalt mr-2">EMPRESA</span>
            Publicação como conteúdo oficial de <strong>{myCompany.name}</strong>.
          </div>
        )}

        {tab === 'promotion' && (
          <div className="mb-4 rounded-2xl border border-magenta/30 bg-magenta/[0.05] p-4">
            <div className="chip chip-magenta">
              <Sparkles size={11} strokeWidth={2.5} />
              IMPULSIONAMENTO
            </div>
            <p className="mt-2 text-sm leading-6 text-ink">
              Destaque profissionais, perfis de loja ou uma pequena vitrine de produtos.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'promotion' && (
            <div className="space-y-4 rounded-2xl border border-line bg-ink/[0.02] p-4 dark:bg-white/[0.03]">
              <div className="grid gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setPromotionMode('professional');
                    resetProductSelection();
                  }}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    promotionMode === 'professional'
                      ? 'halo halo-amber border-amber/40 bg-amber/[0.06]'
                      : 'border-line bg-surface hover:border-amber/30'
                  }`}
                >
                  <BriefcaseBusiness size={18} className="text-amber" />
                  <p className="mt-3 font-display text-sm font-bold text-ink">Profissional</p>
                  <p className="mt-1 text-xs leading-5 text-mute">
                    Eletricista, manicure, técnico, pintor...
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPromotionMode('company-profile');
                    resetProductSelection();
                  }}
                  disabled={!myCompany}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    promotionMode === 'company-profile'
                      ? 'halo halo-cobalt border-cobalt/40 bg-cobalt/[0.06]'
                      : 'border-line bg-surface hover:border-cobalt/30'
                  } ${!myCompany ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Store size={18} className="text-cobalt" />
                  <p className="mt-3 font-display text-sm font-bold text-ink">Perfil da loja</p>
                  <p className="mt-1 text-xs leading-5 text-mute">
                    Destaque institucional da empresa.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPromotionMode('company-products')}
                  disabled={!myCompany}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    promotionMode === 'company-products'
                      ? 'halo halo-magenta border-magenta/40 bg-magenta/[0.06]'
                      : 'border-line bg-surface hover:border-magenta/30'
                  } ${!myCompany ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Package2 size={18} className="text-magenta" />
                  <p className="mt-3 font-display text-sm font-bold text-ink">Vitrine</p>
                  <p className="mt-1 text-xs leading-5 text-mute">
                    Mostre 1 a 3 produtos como impulsionamento.
                  </p>
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Título do impulsionamento *"
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
                  label="Subtítulo"
                  value={promotion.subtitle}
                  onChange={(e) => setPromotion((state) => ({ ...state, subtitle: e.target.value }))}
                  placeholder="Atendimento rápido e orçamento na hora"
                />
                <Input
                  label="Área de atendimento"
                  value={promotion.serviceArea}
                  onChange={(e) => setPromotion((state) => ({ ...state, serviceArea: e.target.value }))}
                  placeholder="Palmital, Ourinhos e região"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Destaques (separe por vírgula)"
                    value={promotion.highlights}
                    onChange={(e) => setPromotion((state) => ({ ...state, highlights: e.target.value }))}
                    placeholder="plantão, instalação, revisão"
                  />
                </div>
              </div>

              {promotionMode === 'company-products' && myCompany?.products?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm font-bold text-ink">Produtos em destaque</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                        Selecione de 1 a 3 produtos
                      </p>
                    </div>
                    <span className="chip chip-magenta">
                      <Megaphone size={11} />
                      {promotion.productIds.length}/3
                    </span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {myCompany.products.map((product: any) => {
                      const isSelected = promotion.productIds.includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'halo halo-magenta border-magenta/40 bg-magenta/[0.06]'
                              : 'border-line bg-surface'
                          }`}
                        >
                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/5">
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-bold text-ink">
                              {product.name}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-mute">
                              {product.description || 'Sem descrição'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              tab === 'classified'
                ? 'Descrição do anúncio (opcional)'
                : tab === 'business'
                  ? 'Compartilhe novidades, promoções ou atualizações da sua empresa'
                  : tab === 'promotion'
                    ? 'Escreva um apoio opcional para o card impulsionado'
                    : 'O que está acontecendo em Palmital?'
            }
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-line bg-ink/[0.03] p-4 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
          />

          {tab === 'classified' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Título do anúncio *"
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
                  label="Descrição *"
                  value={classified.description}
                  onChange={(e) => setClassified((c) => ({ ...c, description: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 md:col-span-2 dark:bg-white/[0.04]">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={classified.isFree}
                  onChange={(e) => setClassified((c) => ({ ...c, isFree: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="isFree" className="text-sm text-ink">
                  É grátis
                </label>
              </div>
              {!classified.isFree && (
                <Input
                  label="Preço (R$)"
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
            ref={uploaderRef}
            onUpload={(id) => setMediaIds((ids) => [...ids, id])}
            onRemove={(id) => setMediaIds((ids) => ids.filter((mediaId) => mediaId !== id))}
            onUploadingChange={setIsMediaUploading}
            maxFiles={4}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={mutation.isPending || isFinalizingPost}
            disabled={mutation.isPending || isFinalizingPost}
            className={`halo ${currentAccent.halo}`}
          >
            {isMediaUploading && !mutation.isPending && !isFinalizingPost
              ? 'Aguardando uploads...'
              : 'Publicar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
