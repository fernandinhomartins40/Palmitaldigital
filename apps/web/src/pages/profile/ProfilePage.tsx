import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Input, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { ImageCropDialog } from '../../components/shared/ImageCropDialog';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { disconnectSocket } from '../../services/socket';
import { getLoginPath } from '../../utils/pwa';
import {
  Building2,
  Camera,
  Car,
  ExternalLink,
  LogOut,
  MapPin,
  Newspaper,
  Phone,
  ShoppingBag,
  UserCircle2,
  UtensilsCrossed,
} from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, setUser } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    city: '',
    phone: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data as any;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.profile?.displayName ?? '',
      bio: profile.profile?.bio ?? '',
      city: profile.profile?.city ?? '',
      phone: profile.phone ?? '',
    });
    setUser({
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      profile: profile.profile
        ? {
            displayName: profile.profile.displayName,
            avatarUrl: profile.profile.avatarUrl,
            coverUrl: profile.profile.coverUrl,
          }
        : null,
    });
  }, [profile, setUser]);

  const updateMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      await api.patch('/users/me', dto);
      const { data } = await api.get('/users/me');
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['public-profile', user?.id] });
      setEditing(false);
      addToast('Perfil atualizado!', 'success');
    },
    onError: () => addToast('Erro ao atualizar perfil', 'error'),
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.get('/users/me');
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['public-profile', user?.id] });
      addToast('Avatar atualizado!', 'success');
    },
    onError: () => addToast('Erro ao enviar avatar', 'error'),
  });

  const coverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/users/me/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.get('/users/me');
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['public-profile', user?.id] });
      addToast('Capa atualizada!', 'success');
    },
    onError: () => addToast('Erro ao enviar capa', 'error'),
  });

  const removeCoverMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/me/cover');
      const { data } = await api.get('/users/me');
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['public-profile', user?.id] });
      addToast('Capa removida!', 'success');
    },
    onError: () => addToast('Erro ao remover capa', 'error'),
  });

  function handleLogout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    disconnectSocket();
    logout();
    navigate(getLoginPath());
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    e.target.value = '';
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    e.target.value = '';
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const p = profile?.profile;
  const displayName = p?.displayName ?? user?.profile?.displayName ?? user?.email ?? 'Usuario';
  const role = profile?.role as string | undefined;

  const roleShortcuts: Array<{
    role: string;
    label: string;
    chip: string;
    icon: any;
    to: string;
    cta: string;
  }> = [
    { role: 'DRIVER', label: 'Motorista', chip: 'chip-cobalt', icon: Car, to: '/rides/driver', cta: 'Painel do motorista' },
    { role: 'RESTAURANT_OWNER', label: 'Restaurante', chip: 'chip-coral', icon: UtensilsCrossed, to: '/delivery/manage', cta: 'Gerenciar restaurante' },
    { role: 'JOURNALIST', label: 'Jornalista', chip: 'chip-magenta', icon: Newspaper, to: '/news/write', cta: 'Escrever matéria' },
    { role: 'BUSINESS_OWNER', label: 'Empresa', chip: 'chip-mint', icon: Building2, to: '/companies/manage', cta: 'Gerenciar loja' },
  ];
  const activeRole = roleShortcuts.find((r) => r.role === role);

  return (
    <div className="space-y-5">
      <div className="glass shape-signature-lg overflow-hidden">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden bg-ink/[0.04] sm:h-44 lg:h-52 dark:bg-white/[0.04]">
          {p?.coverUrl ? (
            <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 50%, #FF5B49 0%, transparent 55%), radial-gradient(circle at 70% 50%, #3D5AFE 0%, transparent 55%)' }} />
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="btn-glass absolute right-3 top-3 !py-2 !text-xs"
            disabled={coverMutation.isPending}
          >
            <Camera size={14} />
            Trocar capa
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        <div className="px-5 pb-6 pt-4 lg:px-8 lg:pb-8">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-14 inline-flex lg:-mt-20">
                <div
                  className="relative bg-surface p-1 dark:bg-canvas"
                  style={{ borderRadius: '28px 28px 8px 28px' }}
                >
                  <div className="overflow-hidden" style={{ borderRadius: '24px 24px 4px 24px' }}>
                    <Avatar
                      src={p?.avatarUrl}
                      name={displayName}
                      size="xl"
                      className="!h-24 !w-24 !rounded-none !ring-0 lg:!h-32 lg:!w-32 lg:!text-4xl"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="halo halo-coral absolute -bottom-1 -right-1 rounded-full border-2 border-surface bg-coral p-2 text-white transition-colors hover:scale-110 dark:border-canvas"
                    disabled={avatarMutation.isPending}
                    aria-label="Alterar avatar"
                  >
                    <Camera size={14} strokeWidth={2.4} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="mt-4 min-w-0 space-y-1 lg:mt-0 lg:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink lg:text-[2rem]">
                    {displayName}
                  </h1>
                  {activeRole && (
                    <span className={`chip ${activeRole.chip}`}>
                      <activeRole.icon size={11} strokeWidth={2.5} />
                      {activeRole.label}
                    </span>
                  )}
                </div>
                <p className="break-all font-mono text-[10px] uppercase tracking-wider text-mute">
                  {profile?.email}
                </p>
                {p?.bio && (
                  <p className="max-w-3xl pt-2 text-sm leading-relaxed text-ink">
                    {p.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 lg:mt-0 lg:w-[19rem] lg:shrink-0">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setEditing((value) => !value)}
              >
                {editing ? 'Fechar edição' : 'Editar perfil'}
              </Button>
              {user?.id && (
                <Link to={`/profile/${user.id}?preview=public`}>
                  <Button fullWidth variant="glass">
                    <ExternalLink size={15} />
                    <span className="ml-2">Ver perfil público</span>
                  </Button>
                </Link>
              )}
              {p?.coverUrl && (
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => removeCoverMutation.mutate()}
                  disabled={removeCoverMutation.isPending}
                >
                  Remover capa
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 lg:mt-7 lg:grid-cols-2">
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-coral" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Cidade</p>
              <p className="mt-1 font-display text-sm font-bold text-ink">
                {p?.city || 'Não informada'}
              </p>
            </div>
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-cobalt" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Telefone</p>
              <p className="mt-1 font-display text-sm font-bold text-ink">
                {profile?.phone || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Atividade + atalhos de papel */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {user?.id && (
              <Link
                to={`/profile/${user.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 transition-colors hover:border-coral hover:bg-coral/[0.05] dark:bg-white/[0.04]"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-ink">
                  <UserCircle2 size={16} className="text-coral" />
                  Minha atividade
                </span>
                <ExternalLink size={15} className="text-mute" />
              </Link>
            )}
            {activeRole ? (
              <Link
                to={activeRole.to}
                className="flex items-center justify-between rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 transition-colors hover:border-cobalt hover:bg-cobalt/[0.05] dark:bg-white/[0.04]"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-ink">
                  <activeRole.icon size={16} className="text-cobalt" />
                  {activeRole.cta}
                </span>
                <ExternalLink size={15} className="text-mute" />
              </Link>
            ) : (
              <Link
                to="/classifieds/mine"
                className="flex items-center justify-between rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 transition-colors hover:border-citrus hover:bg-citrus/[0.08] dark:bg-white/[0.04]"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-ink">
                  <ShoppingBag size={16} className="text-citrus" />
                  Meus anúncios
                </span>
                <ExternalLink size={15} className="text-mute" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="glass shape-signature space-y-4 p-5 lg:p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Editar perfil</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              Como Palmital te vê
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <Input
              label="Nome de exibição"
              value={form.displayName}
              onChange={(e) => setForm((state) => ({ ...state, displayName: e.target.value }))}
              required
              maxLength={100}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-mute">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((state) => ({ ...state, bio: e.target.value }))}
                rows={4}
                maxLength={300}
                className="rounded-2xl border border-line bg-ink/[0.03] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Cidade"
                value={form.city}
                onChange={(e) => setForm((state) => ({ ...state, city: e.target.value }))}
                maxLength={100}
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => setForm((state) => ({ ...state, phone: e.target.value }))}
                maxLength={30}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="ghost" fullWidth type="button" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button fullWidth type="submit" isLoading={updateMutation.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass shape-signature space-y-4 p-5 lg:p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Conta</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              Dados principais e sessão
            </p>
          </div>

          <div className="grid gap-3 text-sm text-ink lg:grid-cols-2">
            <p className="flex items-center gap-2">
              <UserCircle2 size={16} className="text-mute" />
              {displayName}
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={16} className="text-mute" />
              {p?.city || 'Cidade não informada'}
            </p>
            <p className="flex items-center gap-2 lg:col-span-2">
              <Phone size={16} className="text-mute" />
              {profile?.phone || 'Telefone não informado'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/[0.05] py-3 text-sm font-bold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      )}

      <ImageCropDialog
        open={!!avatarFile}
        file={avatarFile}
        title="Ajustar avatar"
        aspect={1}
        cropShape="round"
        outputWidth={512}
        outputHeight={512}
        quality={0.82}
        onCancel={() => setAvatarFile(null)}
        onConfirm={(file) => {
          setAvatarFile(null);
          avatarMutation.mutate(file);
        }}
      />

      <ImageCropDialog
        open={!!coverFile}
        file={coverFile}
        title="Ajustar capa do perfil"
        aspect={16 / 9}
        outputWidth={1600}
        outputHeight={900}
        quality={0.8}
        onCancel={() => setCoverFile(null)}
        onConfirm={(file) => {
          setCoverFile(null);
          coverMutation.mutate(file);
        }}
      />
    </div>
  );
}
