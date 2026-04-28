import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Card, Input, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { disconnectSocket } from '../../services/socket';
import { Camera, ExternalLink, LogOut, MapPin, Phone, UserCircle2 } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, setUser } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);
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

  function handleLogout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    disconnectSocket();
    logout();
    navigate('/login');
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarMutation.mutate(file);
    e.target.value = '';
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const p = profile?.profile;
  const displayName = p?.displayName ?? user?.profile?.displayName ?? user?.email ?? 'Usuário';

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <Card className="overflow-hidden border-blue-100/80 p-0 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
        <div className="relative h-28 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500">
          <div className="absolute inset-y-0 right-0 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 left-4">
            <div className="relative rounded-[28px] border-4 border-white bg-white shadow-lg shadow-blue-900/10">
              <Avatar src={p?.avatarUrl} name={displayName} size="lg" className="h-16 w-16 text-2xl" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-blue-600 p-2 text-white shadow-md transition-colors hover:bg-blue-700"
                disabled={avatarMutation.isPending}
                aria-label="Alterar avatar"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-5 pt-12">
          <div className="space-y-1">
            <h1 className="text-[1.35rem] font-bold leading-tight text-gray-900">{displayName}</h1>
            <p className="break-all text-sm text-gray-500">{profile?.email}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Cidade</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{p?.city || 'Não informada'}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Telefone</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{profile?.phone || 'Não informado'}</p>
            </div>
          </div>

          {p?.bio && (
            <p className="mt-4 rounded-2xl bg-blue-50/60 px-3 py-3 text-sm leading-relaxed text-gray-700">
              {p.bio}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              className="rounded-xl py-3"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? 'Fechar edição' : 'Gerenciar perfil'}
            </Button>
            {user?.id && (
              <Link to={`/profile/${user.id}?preview=public`} className="block flex-1">
                <Button fullWidth size="sm" className="rounded-xl px-4 py-3 whitespace-nowrap">
                  <ExternalLink size={16} />
                  <span className="ml-2">Ver versão pública</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {editing ? (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Editar perfil</h2>
            <p className="text-sm text-gray-500">Atualize como a comunidade vê você.</p>
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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((state) => ({ ...state, bio: e.target.value }))}
                rows={4}
                maxLength={300}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

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

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button fullWidth type="submit" isLoading={updateMutation.isPending}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Minha conta</h2>
            <p className="text-sm text-gray-500">Gerencie seus dados principais e sessão ativa.</p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <UserCircle2 size={16} className="text-gray-400" />
              {displayName}
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              {p?.city || 'Cidade não informada'}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              {profile?.phone || 'Telefone não informado'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </Card>
      )}
    </div>
  );
}
