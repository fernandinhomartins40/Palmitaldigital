import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Input, Spinner } from '@palmital/ui';
import { PostEngagement } from '../../components/feed/PostEngagement';
import { PostMediaGallery } from '../../components/feed/PostMediaGallery';
import { ImageCropDialog } from '../../components/shared/ImageCropDialog';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import {
  BadgeCheck,
  Camera,
  ExternalLink,
  ImagePlus,
  MapPin,
  Megaphone,
  Package2,
  Phone,
  PlusCircle,
  Store,
  Trash2,
} from 'lucide-react';

type CompanyFormState = {
  name: string;
  category: string;
  city: string;
  phone: string;
  address: string;
  description: string;
  isActive: boolean;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
};

const emptyCompanyForm: CompanyFormState = {
  name: '',
  category: '',
  city: '',
  phone: '',
  address: '',
  description: '',
  isActive: true,
};

const emptyProductForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  isAvailable: true,
};

export function CompanyManagerPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const { setUser } = useAuthStore();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [newProduct, setNewProduct] = useState<ProductFormState>(emptyProductForm);
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductFormState>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['my-company'],
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

  useEffect(() => {
    if (!company) {
      setCompanyForm(emptyCompanyForm);
      setProductDrafts({});
      return;
    }

    setCompanyForm({
      name: company.name ?? '',
      category: company.category ?? '',
      city: company.city ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      description: company.description ?? '',
      isActive: company.isActive ?? true,
    });

    setProductDrafts(
      Object.fromEntries(
        (company.products ?? []).map((product: any) => [
          product.id,
          {
            name: product.name ?? '',
            description: product.description ?? '',
            price: product.price != null ? String(product.price) : '',
            isAvailable: product.isAvailable ?? true,
          },
        ]),
      ),
    );
  }, [company]);

  const companySlug = company?.slug;
  const companyLogo = company?.logoUrl;
  const companyCover = company?.coverUrl;

  async function syncAuthUser() {
    const { data } = await api.get('/users/me');
    const nextUser = {
      id: data.id,
      email: data.email,
      phone: data.phone,
      role: data.role,
      profile: data.profile
        ? {
            displayName: data.profile.displayName,
            avatarUrl: data.profile.avatarUrl,
            coverUrl: data.profile.coverUrl,
          }
        : null,
    };
    setUser(nextUser);
  }

  function invalidateCompanyData(slug?: string) {
    queryClient.invalidateQueries({ queryKey: ['my-company'] });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    if (slug) {
      queryClient.invalidateQueries({ queryKey: ['company', slug] });
    }
  }

  const createCompanyMutation = useMutation({
    mutationFn: async (payload: CompanyFormState) => {
      const { data } = await api.post('/companies', payload);
      return data as any;
    },
    onSuccess: async (data) => {
      await syncAuthUser();
      invalidateCompanyData(data.slug);
      addToast('Perfil da empresa criado!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao criar empresa', 'error');
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (payload: CompanyFormState) => {
      const { data } = await api.patch('/companies/me', payload);
      return data as any;
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Empresa atualizada!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao atualizar empresa', 'error');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: ProductFormState) => {
      const { data } = await api.post('/companies/me/products', {
        name: payload.name,
        description: payload.description || undefined,
        price: payload.price ? Number(payload.price) : undefined,
        isAvailable: payload.isAvailable,
      });
      return data as any;
    },
    onSuccess: () => {
      setNewProduct(emptyProductForm);
      invalidateCompanyData(companySlug);
      addToast('Produto criado!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao criar produto', 'error');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: string;
      payload: ProductFormState;
    }) => {
      const { data } = await api.patch(`/companies/me/products/${productId}`, {
        name: payload.name,
        description: payload.description || undefined,
        price: payload.price ? Number(payload.price) : undefined,
        isAvailable: payload.isAvailable,
      });
      return data as any;
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Produto atualizado!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao atualizar produto', 'error');
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/companies/me/products/${productId}`);
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Produto removido!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao remover produto', 'error');
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/companies/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Logo atualizada!', 'success');
    },
    onError: () => addToast('Erro ao enviar logo', 'error'),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/companies/me/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Capa atualizada!', 'success');
    },
    onError: () => addToast('Erro ao enviar capa', 'error'),
  });

  const removeImageMutation = useMutation({
    mutationFn: async (type: 'logo' | 'cover') => {
      await api.delete(`/companies/me/${type}`);
    },
    onSuccess: (_, type) => {
      invalidateCompanyData(companySlug);
      addToast(type === 'logo' ? 'Logo removida!' : 'Capa removida!', 'success');
    },
    onError: () => addToast('Erro ao remover imagem', 'error'),
  });

  const productImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/companies/me/products/${productId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Imagem do produto atualizada!', 'success');
    },
    onError: () => addToast('Erro ao enviar imagem do produto', 'error'),
  });

  const removeProductImageMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/companies/me/products/${productId}/image`);
    },
    onSuccess: () => {
      invalidateCompanyData(companySlug);
      addToast('Imagem do produto removida!', 'success');
    },
    onError: () => addToast('Erro ao remover imagem do produto', 'error'),
  });

  const products = useMemo(() => company?.products ?? [], [company]);
  const recentPosts = useMemo(() => company?.posts ?? [], [company]);
  const totalProducts = company?._count?.products ?? products.length;
  const totalPosts = company?._count?.posts ?? recentPosts.length;

  function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyForm.name.trim()) {
      addToast('Informe o nome da empresa', 'error');
      return;
    }

    if (company) {
      updateCompanyMutation.mutate(companyForm);
      return;
    }

    createCompanyMutation.mutate(companyForm);
  }

  function handleNewProductSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newProduct.name.trim()) {
      addToast('Informe o nome do produto', 'error');
      return;
    }

    createProductMutation.mutate(newProduct);
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    onSelect: (file: File) => void,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelect(file);
    event.target.value = '';
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {company ? (
        <>
          <div className="glass shape-signature-lg overflow-hidden">
            <div className="relative h-40 overflow-hidden bg-ink/[0.04] lg:h-52 dark:bg-white/[0.04]">
              {companyCover ? (
                <img src={companyCover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 50%, #3D5AFE 0%, transparent 55%), radial-gradient(circle at 70% 50%, #5EEAD4 0%, transparent 55%)' }} />
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="btn-glass absolute right-4 top-4 !py-2 !text-xs"
              >
                <Camera size={14} />
                Trocar capa
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelection(e, setCoverFile)}
              />
            </div>

            <div className="px-4 pb-5 pt-4 lg:px-8 lg:pb-8 lg:pt-0">
              <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
                <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
                  <div className="-mt-10 inline-flex lg:-mt-14">
                    <div className="relative bg-surface p-1 dark:bg-canvas" style={{ borderRadius: '28px 28px 8px 28px' }}>
                      <Avatar
                        src={companyLogo}
                        name={company.name}
                        size="lg"
                        className="h-16 w-16 text-2xl lg:h-24 lg:w-24 lg:text-3xl"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="halo halo-cobalt absolute -bottom-1 -right-1 rounded-full border-2 border-surface bg-cobalt p-2 text-white transition-transform hover:scale-110 dark:border-canvas"
                        aria-label="Alterar logo"
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e, setLogoFile)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-[1.5rem] font-bold leading-tight tracking-tight text-ink lg:text-[2rem]">
                        {company.name}
                      </h1>
                      {company.isVerified ? (
                        <span className="chip chip-cobalt">
                          <BadgeCheck size={11} />
                          VERIFICADA
                        </span>
                      ) : null}
                      <span
                        className={company.isActive ? 'chip chip-mint' : 'chip chip-amber'}
                      >
                        {company.isActive ? 'ATIVA' : 'PAUSADA'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-mute">
                      {company.category || 'Categoria não informada'}
                    </p>
                    <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-mute">
                      {company.city ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} />
                          {company.city}
                        </span>
                      ) : null}
                      {company.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={14} />
                          {company.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 lg:mt-0 lg:w-[19rem] lg:shrink-0">
                  <Link to={`/companies/${company.slug}`} className="block">
                    <Button fullWidth>
                      <ExternalLink size={16} />
                      <span className="ml-2">Ver perfil público</span>
                    </Button>
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="glass"
                      size="sm"
                      fullWidth
                      onClick={() => removeImageMutation.mutate('logo')}
                      disabled={!companyLogo}
                    >
                      Remover logo
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      fullWidth
                      onClick={() => removeImageMutation.mutate('cover')}
                      disabled={!companyCover}
                    >
                      Remover capa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="glass shape-signature p-5">
              <div className="flex items-center gap-3">
                <div className="halo halo-cobalt flex h-11 w-11 items-center justify-center rounded-xl bg-cobalt text-white">
                  <Store size={18} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Status</p>
                  <p className="font-display text-base font-bold text-ink">
                    {company.isActive ? 'Público ativo' : 'Pausado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass shape-signature p-5">
              <div className="flex items-center gap-3">
                <div className="halo halo-citrus flex h-11 w-11 items-center justify-center rounded-xl bg-citrus text-ink">
                  <Package2 size={18} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Catálogo</p>
                  <p className="font-display text-base font-bold text-ink">
                    {totalProducts} produtos
                  </p>
                </div>
              </div>
            </div>

            <div className="glass shape-signature p-5">
              <div className="flex items-center gap-3">
                <div className="halo halo-magenta flex h-11 w-11 items-center justify-center rounded-xl bg-magenta text-white">
                  <Megaphone size={18} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Posts</p>
                  <p className="font-display text-base font-bold text-ink">
                    {totalPosts} publicações
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass shape-signature space-y-5 p-5 lg:p-6">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">Configurações da empresa</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                Atualize dados, disponibilidade e contato
              </p>
            </div>

            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Nome da empresa"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm((state) => ({ ...state, name: e.target.value }))}
                  required
                  maxLength={100}
                />
                <Input
                  label="Categoria"
                  value={companyForm.category}
                  onChange={(e) =>
                    setCompanyForm((state) => ({ ...state, category: e.target.value }))
                  }
                  maxLength={100}
                />
                <Input
                  label="Cidade"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm((state) => ({ ...state, city: e.target.value }))}
                  maxLength={100}
                />
                <Input
                  label="Telefone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm((state) => ({ ...state, phone: e.target.value }))}
                  maxLength={40}
                />
              </div>

              <Input
                label="Endereco"
                value={companyForm.address}
                onChange={(e) => setCompanyForm((state) => ({ ...state, address: e.target.value }))}
                maxLength={200}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-mute">Descrição</label>
                <textarea
                  value={companyForm.description}
                  onChange={(e) =>
                    setCompanyForm((state) => ({ ...state, description: e.target.value }))
                  }
                  rows={5}
                  maxLength={1000}
                  className="rounded-2xl border border-line bg-ink/[0.03] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 text-sm text-ink dark:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={companyForm.isActive}
                  onChange={(e) =>
                    setCompanyForm((state) => ({ ...state, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded"
                />
                Exibir empresa e catálogo publicamente
              </label>

              <Button fullWidth type="submit" isLoading={updateCompanyMutation.isPending}>
                Salvar configurações
              </Button>
            </form>
          </div>

          <div className="glass shape-signature space-y-5 p-5 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">Publicações</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  Divulgue novidades e promoções
                </p>
              </div>
              <Link to="/create" className="block lg:w-[18rem]">
                <Button fullWidth>
                  <Megaphone size={16} />
                  <span className="ml-2">Criar publicação</span>
                </Button>
              </Link>
            </div>

            {!recentPosts.length ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-mute">
                Nenhuma publicação empresarial ainda.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {recentPosts.map((post: any) => (
                  <div key={post.id} className="rounded-2xl border border-line bg-ink/[0.02] p-4 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="chip">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
                        {post.media?.length ?? 0} arquivos
                      </span>
                    </div>

                    {post.content ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        {post.content}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-mute">Somente mídia.</p>
                    )}

                    <PostMediaGallery media={post.media ?? []} />
                    <PostEngagement post={post} accent="cobalt" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass shape-signature space-y-5 p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">Catálogo de produtos</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  Cadastre, edite e organize
                </p>
              </div>
              <span className="chip chip-citrus">
                {products.length} itens
              </span>
            </div>

            <form
              onSubmit={handleNewProductSubmit}
              className="space-y-4 rounded-2xl border border-dashed border-coral/30 bg-coral/[0.04] p-4"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
                <PlusCircle size={14} />
                Novo produto
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Nome"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((state) => ({ ...state, name: e.target.value }))}
                  required
                />
                <Input
                  label="Preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((state) => ({ ...state, price: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-mute">Descrição</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((state) => ({ ...state, description: e.target.value }))
                  }
                  rows={3}
                  className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:ring-4 focus:ring-coral/15"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={newProduct.isAvailable}
                  onChange={(e) =>
                    setNewProduct((state) => ({ ...state, isAvailable: e.target.checked }))
                  }
                  className="h-4 w-4 rounded"
                />
                Produto disponível para exibição
              </label>
              <Button type="submit" isLoading={createProductMutation.isPending}>
                Criar produto
              </Button>
            </form>

            {!products.length ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-mute">
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {products.map((product: any) => {
                  const draft = productDrafts[product.id] ?? emptyProductForm;

                  return (
                    <div key={product.id} className="rounded-2xl border border-line bg-ink/[0.02] p-4 space-y-4 dark:bg-white/[0.04]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink/5 dark:bg-white/5">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImagePlus size={22} className="text-mute" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-base font-bold text-ink">
                            {product.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
                            {product.isAvailable ? 'Visível' : 'Oculto'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink hover:bg-ink/5">
                              <Camera size={14} />
                              Trocar imagem
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) =>
                                  handleFileSelection(e, (file) =>
                                    productImageMutation.mutate({ productId: product.id, file }),
                                  )
                                }
                              />
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductImageMutation.mutate(product.id)}
                              disabled={!product.imageUrl}
                            >
                              Remover imagem
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <Input
                          label="Nome"
                          value={draft.name}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, name: e.target.value },
                            }))
                          }
                        />
                        <Input
                          label="Preco"
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.price}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, price: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-mute">Descrição</label>
                        <textarea
                          value={draft.description}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, description: e.target.value },
                            }))
                          }
                          rows={3}
                          className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-coral focus:ring-4 focus:ring-coral/15"
                        />
                      </div>

                      <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={draft.isAvailable}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, isAvailable: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 rounded"
                        />
                        Disponível para venda/exibição
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          fullWidth
                          onClick={() =>
                            updateProductMutation.mutate({ productId: product.id, payload: draft })
                          }
                          isLoading={updateProductMutation.isPending}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="danger"
                          fullWidth
                          onClick={() => removeProductMutation.mutate(product.id)}
                          isLoading={removeProductMutation.isPending}
                        >
                          <Trash2 size={16} />
                          <span className="ml-2">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass shape-signature-lg space-y-5 p-5 lg:p-6">
          <div className="flex items-start gap-4">
            <div className="halo halo-cobalt flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt text-white">
              <Store size={26} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-ink">Criar perfil da empresa</h1>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
                Identidade visual + catálogo + página pública
              </p>
            </div>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Nome da empresa"
                value={companyForm.name}
                onChange={(e) => setCompanyForm((state) => ({ ...state, name: e.target.value }))}
                required
                maxLength={100}
              />
              <Input
                label="Categoria"
                value={companyForm.category}
                onChange={(e) =>
                  setCompanyForm((state) => ({ ...state, category: e.target.value }))
                }
                maxLength={100}
              />
              <Input
                label="Cidade"
                value={companyForm.city}
                onChange={(e) => setCompanyForm((state) => ({ ...state, city: e.target.value }))}
                maxLength={100}
              />
              <Input
                label="Telefone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm((state) => ({ ...state, phone: e.target.value }))}
                maxLength={40}
              />
            </div>

            <Input
              label="Endereço"
              value={companyForm.address}
              onChange={(e) => setCompanyForm((state) => ({ ...state, address: e.target.value }))}
              maxLength={200}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-mute">Descrição</label>
              <textarea
                value={companyForm.description}
                onChange={(e) =>
                  setCompanyForm((state) => ({ ...state, description: e.target.value }))
                }
                rows={5}
                maxLength={1000}
                className="rounded-2xl border border-line bg-ink/[0.03] px-4 py-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
              />
            </div>

            <Button type="submit" fullWidth isLoading={createCompanyMutation.isPending}>
              Criar empresa
            </Button>
          </form>
        </div>
      )}

      <ImageCropDialog
        open={!!logoFile}
        file={logoFile}
        title="Ajustar logo da empresa"
        aspect={1}
        cropShape="round"
        outputWidth={720}
        outputHeight={720}
        quality={0.82}
        onCancel={() => setLogoFile(null)}
        onConfirm={(file) => {
          setLogoFile(null);
          uploadLogoMutation.mutate(file);
        }}
      />

      <ImageCropDialog
        open={!!coverFile}
        file={coverFile}
        title="Ajustar capa da empresa"
        aspect={16 / 9}
        outputWidth={1600}
        outputHeight={900}
        quality={0.8}
        onCancel={() => setCoverFile(null)}
        onConfirm={(file) => {
          setCoverFile(null);
          uploadCoverMutation.mutate(file);
        }}
      />
    </div>
  );
}
