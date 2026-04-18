import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { formatCurrency, formatDate } from '@palmital/utils';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { MapPin, Tag } from 'lucide-react';

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
    mutationFn: () => api.post('/chat/conversations', { recipientId: item.authorId }),
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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!item) return null;

  const isOwner = currentUser?.id === item.authorId;
  const profile = item.author?.profile;
  const images = item.post?.media ?? [];

  return (
    <div className="pb-6">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {images.map((m: any) => (
            <img key={m.id} src={m.url} alt="" className="h-56 w-56 flex-shrink-0 rounded-2xl object-cover" />
          ))}
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {item.isFree ? 'Grátis' : item.price ? formatCurrency(Number(item.price)) : 'A consultar'}
          </p>
          {item.status === 'SOLD' && (
            <span className="inline-block mt-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">Vendido</span>
          )}
        </div>

        <p className="text-gray-700">{item.description}</p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          {item.city && <span className="flex items-center gap-1"><MapPin size={14} />{item.city}</span>}
          {item.category && <span className="flex items-center gap-1"><Tag size={14} />{item.category.name}</span>}
          <span>Publicado em {formatDate(item.createdAt)}</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
          <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="md" />
          <div>
            <p className="font-semibold text-gray-900">{profile?.displayName}</p>
            <p className="text-xs text-gray-500">Vendedor</p>
          </div>
        </div>

        {!isOwner && item.status === 'ACTIVE' && (
          <Button fullWidth onClick={() => startChatMutation.mutate()} isLoading={startChatMutation.isPending}>
            Enviar mensagem
          </Button>
        )}

        {isOwner && item.status === 'ACTIVE' && (
          <Button variant="secondary" fullWidth onClick={() => markSoldMutation.mutate()} isLoading={markSoldMutation.isPending}>
            Marcar como vendido
          </Button>
        )}
      </div>
    </div>
  );
}
