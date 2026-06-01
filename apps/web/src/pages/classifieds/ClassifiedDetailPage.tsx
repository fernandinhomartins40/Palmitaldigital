import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { formatCurrency, formatDate } from '@palmital/utils';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle2, MapPin, MessageCircle, Pause, Play, Tag, Trash2 } from 'lucide-react';

export function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['classified', id],
    queryFn: async () => {
      const { data } = await api.get(`/classifieds/${id}`);
      return data as any;
    },
  });

  const startChatMutation = useMutation({
    mutationFn: () => {
      if (!item) throw new Error('Item not loaded');
      return api.post('/chat/conversations', { recipientId: item.authorId });
    },
    onSuccess: (res) => navigate(`/chat/${res.data.id}`),
    onError: () => addToast('Erro ao iniciar conversa', 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/classifieds/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classified', id] });
      queryClient.invalidateQueries({ queryKey: ['my-classifieds'] });
      queryClient.invalidateQueries({ queryKey: ['classifieds'] });
      addToast('Anúncio atualizado!', 'success');
    },
    onError: () => addToast('Erro ao atualizar anúncio', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/classifieds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classifieds'] });
      queryClient.invalidateQueries({ queryKey: ['classifieds'] });
      addToast('Anúncio excluído', 'success');
      navigate('/classifieds/mine');
    },
    onError: () => addToast('Erro ao excluir anúncio', 'error'),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  if (!item) return null;

  const isOwner = currentUser?.id === item.authorId;
  const profile = item.author?.profile;
  const images = item.post?.media ?? [];

  return (
    <div className="space-y-5">
      {images.length > 0 && (
        <div className="glass-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((m: any) => (
            <img
              key={m.id}
              src={m.url}
              alt=""
              className="h-72 w-72 flex-shrink-0 object-cover"
              style={{ borderRadius: '24px 24px 8px 24px' }}
            />
          ))}
        </div>
      )}

      <div className="glass shape-signature space-y-5 p-6 lg:p-8">
        <div>
          <div className="chip chip-citrus">
            <Tag size={11} strokeWidth={2.5} />
            CLASSIFICADO
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-ink lg:text-3xl">
            {item.title}
          </h1>
          <p className="mt-2 font-mono text-3xl font-bold text-ink">
            {item.isFree
              ? 'GRÁTIS'
              : item.price
                ? formatCurrency(Number(item.price))
                : 'A consultar'}
          </p>
          {item.status === 'SOLD' && (
            <span className="chip chip-coral mt-2">
              <CheckCircle2 size={11} />
              VENDIDO
            </span>
          )}
          {item.status === 'PAUSED' && (
            <span className="chip chip-amber mt-2">
              <Pause size={11} />
              PAUSADO
            </span>
          )}
        </div>

        <p className="text-[15px] leading-7 text-ink">{item.description}</p>

        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider text-mute">
          {item.city && (
            <span className="chip">
              <MapPin size={10} />
              {item.city}
            </span>
          )}
          {item.category && (
            <span className="chip">
              <Tag size={10} />
              {item.category.name}
            </span>
          )}
          <span className="chip">{formatDate(item.createdAt)}</span>
        </div>

        <Link
          to={`/profile/${item.authorId}`}
          className="flex items-center gap-3 rounded-2xl border border-line bg-ink/[0.02] p-3 transition-colors hover:border-coral hover:bg-coral/[0.05] dark:bg-white/[0.04]"
        >
          <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="md" />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-ink">{profile?.displayName}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              Ver perfil do vendedor
            </p>
          </div>
        </Link>

        {!isOwner && item.status === 'ACTIVE' && (
          <Button
            fullWidth
            onClick={() => startChatMutation.mutate()}
            isLoading={startChatMutation.isPending}
          >
            <MessageCircle size={16} />
            <span className="ml-2">Enviar mensagem</span>
          </Button>
        )}

        {isOwner && (
          <div className="space-y-2 border-t border-line pt-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              Gerenciar anúncio
            </p>
            <div className="flex flex-wrap gap-2">
              {item.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => statusMutation.mutate('SOLD')}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-coral hover:text-white disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    Marcar vendido
                  </button>
                  <button
                    onClick={() => statusMutation.mutate('PAUSED')}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber hover:text-ink disabled:opacity-50"
                  >
                    <Pause size={15} />
                    Pausar
                  </button>
                </>
              )}
              {item.status !== 'ACTIVE' && (
                <button
                  onClick={() => statusMutation.mutate('ACTIVE')}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mint hover:text-ink disabled:opacity-50"
                >
                  <Play size={15} />
                  Reativar
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={statusMutation.isPending}
                className="ml-auto flex items-center gap-1.5 rounded-2xl border border-coral/30 px-4 py-2.5 text-sm font-semibold text-coral transition-colors hover:bg-coral hover:text-white disabled:opacity-50"
              >
                <Trash2 size={15} />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="glass-strong shape-signature w-full max-w-sm space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Excluir anúncio?</h3>
              <p className="mt-1 text-sm text-mute">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl border border-line py-2.5 text-sm font-semibold text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-2xl bg-coral py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
