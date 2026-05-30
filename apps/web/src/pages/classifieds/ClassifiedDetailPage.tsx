import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { formatCurrency, formatDate } from '@palmital/utils';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle2, MapPin, MessageCircle, Tag } from 'lucide-react';

export function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();

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

  const markSoldMutation = useMutation({
    mutationFn: () => api.patch(`/classifieds/${id}/status`, { status: 'SOLD' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classified', id] });
      addToast('Marcado como vendido!', 'success');
    },
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

        {isOwner && item.status === 'ACTIVE' && (
          <Button
            variant="glass"
            fullWidth
            onClick={() => markSoldMutation.mutate()}
            isLoading={markSoldMutation.isPending}
          >
            Marcar como vendido
          </Button>
        )}
      </div>
    </div>
  );
}
