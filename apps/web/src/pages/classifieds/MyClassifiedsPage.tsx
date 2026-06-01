import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Spinner } from '@palmital/ui';
import { formatCurrency, formatRelativeTime } from '@palmital/utils';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Pause,
  Play,
  Plus,
  Store,
  Tag,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type ClassifiedStatus = 'ACTIVE' | 'SOLD' | 'PAUSED' | 'EXPIRED';

const STATUS_META: Record<ClassifiedStatus, { label: string; chip: string }> = {
  ACTIVE: { label: 'Ativo', chip: 'chip-mint' },
  SOLD: { label: 'Vendido', chip: 'chip-coral' },
  PAUSED: { label: 'Pausado', chip: 'chip-amber' },
  EXPIRED: { label: 'Expirado', chip: '' },
};

function ClassifiedRow({
  item,
  onStatus,
  onDelete,
  busy,
}: {
  item: any;
  onStatus: (status: ClassifiedStatus) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const thumb = item.post?.media?.[0]?.url;
  const status = (item.status ?? 'ACTIVE') as ClassifiedStatus;
  const meta = STATUS_META[status];
  const priceLabel = item.isFree
    ? 'GRÁTIS'
    : item.price
      ? formatCurrency(Number(item.price))
      : 'A consultar';

  return (
    <div className="glass shape-signature overflow-hidden">
      <div className="flex gap-3 p-3">
        <Link
          to={`/classifieds/${item.id}`}
          className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-ink/5 dark:bg-white/5"
        >
          {thumb ? (
            <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-mute">
              <Tag size={24} strokeWidth={1.2} />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/classifieds/${item.id}`} className="min-w-0">
              <h3 className="line-clamp-1 font-display text-sm font-bold text-ink">{item.title}</h3>
            </Link>
            <span className={`chip shrink-0 ${meta.chip}`}>{meta.label}</span>
          </div>
          <p className="mt-1 font-mono text-base font-bold text-ink">{priceLabel}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2.5">
        {status === 'ACTIVE' && (
          <>
            <button
              onClick={() => onStatus('SOLD')}
              disabled={busy}
              className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-coral hover:text-white disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              Vendido
            </button>
            <button
              onClick={() => onStatus('PAUSED')}
              disabled={busy}
              className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-amber hover:text-ink disabled:opacity-50"
            >
              <Pause size={13} />
              Pausar
            </button>
          </>
        )}
        {(status === 'PAUSED' || status === 'SOLD' || status === 'EXPIRED') && (
          <button
            onClick={() => onStatus('ACTIVE')}
            disabled={busy}
            className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-mint hover:text-ink disabled:opacity-50"
          >
            <Play size={13} />
            Reativar
          </button>
        )}
        <Link
          to={`/classifieds/${item.id}`}
          className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Eye size={13} />
          Ver
        </Link>
        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto flex items-center gap-1 rounded-xl border border-coral/30 px-3 py-1.5 text-xs font-semibold text-coral transition-colors hover:bg-coral hover:text-white disabled:opacity-50"
        >
          <Trash2 size={13} />
          Excluir
        </button>
      </div>
    </div>
  );
}

export function MyClassifiedsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-classifieds', currentUser?.id],
    queryFn: async () => {
      const { data } = await api.get('/classifieds', {
        params: { authorId: currentUser?.id, limit: 50 },
      });
      return data as { items: any[]; nextCursor: string | null };
    },
    enabled: !!currentUser?.id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClassifiedStatus }) =>
      api.patch(`/classifieds/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classifieds'] });
      queryClient.invalidateQueries({ queryKey: ['classifieds'] });
      addToast('Anúncio atualizado!', 'success');
    },
    onError: () => addToast('Erro ao atualizar anúncio', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classifieds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classifieds'] });
      queryClient.invalidateQueries({ queryKey: ['classifieds'] });
      setConfirmDelete(null);
      addToast('Anúncio excluído', 'success');
    },
    onError: () => addToast('Erro ao excluir anúncio', 'error'),
  });

  const items = data?.items ?? [];
  const busy = statusMutation.isPending || deleteMutation.isPending;
  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const soldCount = items.filter((i) => i.status === 'SOLD').length;

  return (
    <div className="space-y-5">
      <Link
        to="/classifieds"
        className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-mute transition-colors hover:text-ink"
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        Mercado
      </Link>

      {/* Header */}
      <section className="glass shape-signature-lg halo halo-citrus relative overflow-hidden p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="chip chip-citrus">
              <Store size={11} strokeWidth={2.5} />
              MEUS ANÚNCIOS
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
              Gerencie seus anúncios
            </h1>
            <p className="mt-2 text-sm text-mute">Pause, reative, marque como vendido ou exclua.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-mint" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Ativos</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{activeCount}</p>
            </div>
            <div className="relative rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 dark:bg-white/[0.04]">
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-coral" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Vendidos</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{soldCount}</p>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !items.length ? (
        <div className="glass shape-signature px-4 py-12 text-center">
          <Tag size={28} strokeWidth={1.2} className="mx-auto mb-3 text-mute" />
          <p className="font-display font-bold text-ink">Você ainda não anunciou nada</p>
          <p className="mt-1 text-sm text-mute">Crie seu primeiro anúncio para vender na cidade.</p>
          <Link
            to="/create"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-citrus px-4 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-105"
          >
            <Plus size={16} />
            Criar anúncio
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <ClassifiedRow
              key={item.id}
              item={item}
              busy={busy}
              onStatus={(status) => statusMutation.mutate({ id: item.id, status })}
              onDelete={() => setConfirmDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
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
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-2xl border border-line py-2.5 text-sm font-semibold text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
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
