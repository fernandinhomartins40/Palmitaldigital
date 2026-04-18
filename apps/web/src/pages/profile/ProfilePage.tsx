import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar, Button, Input, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { disconnectSocket } from '../../services/socket';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '', city: '' });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      setForm({
        displayName: data.profile?.displayName ?? '',
        bio: data.profile?.bio ?? '',
        city: data.profile?.city ?? '',
      });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: typeof form) => api.patch('/users/me', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
      addToast('Perfil atualizado!', 'success');
    },
    onError: () => addToast('Erro ao atualizar', 'error'),
  });

  function handleLogout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
    disconnectSocket();
    logout();
    navigate('/login');
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const p = profile?.profile;

  return (
    <div className="px-4 pb-6">
      <div className="flex flex-col items-center py-6">
        <Avatar src={p?.avatarUrl} name={p?.displayName ?? user?.email ?? '?'} size="lg" />
        <h1 className="mt-3 text-xl font-bold text-gray-900">{p?.displayName}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
        {p?.city && <p className="text-sm text-gray-500">{p.city}</p>}
      </div>

      {!editing ? (
        <div className="space-y-3">
          {p?.bio && <p className="text-center text-gray-700">{p.bio}</p>}
          <Button variant="secondary" fullWidth onClick={() => setEditing(true)}>
            Editar perfil
          </Button>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 py-2 text-sm text-red-600 hover:underline">
            <LogOut size={16} /> Sair da conta
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }}
          className="space-y-4"
        >
          <Input
            label="Nome"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={300}
              className="rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <Input
            label="Cidade"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth type="button" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button fullWidth type="submit" isLoading={updateMutation.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
