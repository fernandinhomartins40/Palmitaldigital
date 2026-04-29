import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Card, Input, Spinner } from '@palmital/ui';
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
    mutationFn: async ({ productId, payload }: { productId: string; payload: ProductFormState }) => {
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
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-4 lg:px-0">
      {company ? (
        <>
          <Card className="overflow-hidden p-0 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
            <div className="relative h-40 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 lg:h-52">
              {companyCover ? (
                <img src={companyCover} alt="" className="h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute right-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white"
              >
                Trocar capa
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelection(e, (file) => uploadCoverMutation.mutate(file))}
              />
            </div>

            <div className="px-4 pb-5 pt-4 lg:px-8 lg:pb-8 lg:pt-0">
              <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
                <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
                  <div className="-mt-10 inline-flex lg:-mt-14">
                    <div className="relative rounded-[28px] border-4 border-white bg-white shadow-lg">
                      <Avatar
                        src={companyLogo}
                        name={company.name}
                        size="lg"
                        className="h-16 w-16 text-2xl lg:h-24 lg:w-24 lg:text-3xl"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-blue-600 p-2 text-white shadow-md transition-colors hover:bg-blue-700"
                        aria-label="Alterar logo"
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e, (file) => uploadLogoMutation.mutate(file))}
                      />
                    </div>
                  </div>

                  <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-[1.45rem] font-bold leading-tight text-gray-900 lg:text-[2rem]">{company.name}</h1>
                      {company.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                          <BadgeCheck size={14} />
                          Verificada
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${company.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {company.isActive ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {company.category || 'Categoria nao informada'}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
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
                    <Button fullWidth className="rounded-xl py-3">
                      <ExternalLink size={16} />
                      <span className="ml-2">Ver perfil publico</span>
                    </Button>
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      className="rounded-xl py-3"
                      onClick={() => removeImageMutation.mutate('logo')}
                      disabled={!companyLogo}
                    >
                      Remover logo
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      className="rounded-xl py-3"
                      onClick={() => removeImageMutation.mutate('cover')}
                      disabled={!companyCover}
                    >
                      Remover capa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[28px] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Store size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Status</p>
                  <p className="text-base font-semibold text-gray-900">
                    {company.isActive ? 'Perfil publico ativo' : 'Perfil pausado'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <Package2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Catalogo</p>
                  <p className="text-base font-semibold text-gray-900">{totalProducts} produto(s)</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <Megaphone size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Conteudo</p>
                  <p className="text-base font-semibold text-gray-900">{totalPosts} publicacao(oes)</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="space-y-5 p-4 lg:p-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Configuracoes da empresa</h2>
              <p className="text-sm text-gray-500">Atualize os dados do perfil, disponibilidade e informacoes de contato.</p>
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
                  onChange={(e) => setCompanyForm((state) => ({ ...state, category: e.target.value }))}
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

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descricao</label>
                <textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm((state) => ({ ...state, description: e.target.value }))}
                  rows={5}
                  maxLength={1000}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={companyForm.isActive}
                  onChange={(e) => setCompanyForm((state) => ({ ...state, isActive: e.target.checked }))}
                />
                Exibir empresa e catalogo para outros usuarios
              </label>

              <Button fullWidth type="submit" isLoading={updateCompanyMutation.isPending}>
                Salvar configuracoes
              </Button>
            </form>
          </Card>

          <Card className="space-y-5 p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Publicacoes da empresa</h2>
                <p className="text-sm text-gray-500">
                  Use posts empresariais para divulgar novidades, promocoes e avisos oficiais.
                </p>
              </div>
              <Link to="/create" className="block lg:w-[18rem]">
                <Button fullWidth className="rounded-xl">
                  <Megaphone size={16} />
                  <span className="ml-2">Criar publicacao empresarial</span>
                </Button>
              </Link>
            </div>

            {!recentPosts.length ? (
              <div className="rounded-3xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                Nenhuma publicacao empresarial vinculada a esta empresa ainda.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {recentPosts.map((post: any) => (
                  <Card key={post.id} className="space-y-4 rounded-[28px] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {post.media?.length ?? 0} arquivo(s)
                      </span>
                    </div>

                    {post.content ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {post.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Publicacao somente com imagem/video.</p>
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
            )}
          </Card>

          <Card className="space-y-5 p-4 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Catalogo de produtos</h2>
                <p className="text-sm text-gray-500">Cadastre, edite e organize o que sua empresa oferece.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {products.length} item(ns)
              </span>
            </div>

            <form onSubmit={handleNewProductSubmit} className="space-y-4 rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <PlusCircle size={16} />
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descricao</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((state) => ({ ...state, description: e.target.value }))}
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newProduct.isAvailable}
                  onChange={(e) => setNewProduct((state) => ({ ...state, isAvailable: e.target.checked }))}
                />
                Produto disponivel para exibicao
              </label>
              <Button type="submit" isLoading={createProductMutation.isPending}>
                Criar produto
              </Button>
            </form>

            {!products.length ? (
              <div className="rounded-3xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {products.map((product: any) => {
                  const draft = productDrafts[product.id] ?? emptyProductForm;

                  return (
                    <Card key={product.id} className="space-y-4 rounded-[28px] p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus size={22} className="text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-gray-900">{product.name}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {product.isAvailable ? 'Visivel no catalogo' : 'Oculto do catalogo'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                              <Camera size={14} />
                              Trocar imagem
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => handleFileSelection(e, (file) => productImageMutation.mutate({ productId: product.id, file }))}
                              />
                            </label>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="rounded-xl"
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

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Descricao</label>
                        <textarea
                          value={draft.description}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, description: e.target.value },
                            }))
                          }
                          rows={3}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={draft.isAvailable}
                          onChange={(e) =>
                            setProductDrafts((state) => ({
                              ...state,
                              [product.id]: { ...draft, isAvailable: e.target.checked },
                            }))
                          }
                        />
                        Produto disponivel para venda/exibicao
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          fullWidth
                          onClick={() => updateProductMutation.mutate({ productId: product.id, payload: draft })}
                          isLoading={updateProductMutation.isPending}
                        >
                          Salvar produto
                        </Button>
                        <Button
                          variant="secondary"
                          fullWidth
                          className="border-red-100 text-red-600 hover:bg-red-50"
                          onClick={() => removeProductMutation.mutate(product.id)}
                          isLoading={removeProductMutation.isPending}
                        >
                          <Trash2 size={16} />
                          <span className="ml-2">Excluir</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="space-y-5 p-4 lg:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-blue-50 p-4 text-blue-600">
              <Store size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Criar perfil da sua empresa</h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure sua vitrine local com identidade visual, contato, catalogo e pagina publica.
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
                onChange={(e) => setCompanyForm((state) => ({ ...state, category: e.target.value }))}
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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Descricao</label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm((state) => ({ ...state, description: e.target.value }))}
                rows={5}
                maxLength={1000}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" fullWidth isLoading={createCompanyMutation.isPending}>
              Criar empresa
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
