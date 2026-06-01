import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@palmital/utils';
import { ArrowLeft, Check, ChevronRight, Package2, X } from 'lucide-react';
import { companiesApi, type CompanyOrder } from '../../services/companiesApi';
import { useUIStore } from '../../store/uiStore';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando',
  ACCEPTED: 'Aceito',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  PENDING: { status: 'ACCEPTED', label: 'Aceitar pedido' },
  ACCEPTED: { status: 'PREPARING', label: 'Iniciar preparo' },
  PREPARING: { status: 'READY', label: 'Marcar pronto' },
  READY: { status: 'COMPLETED', label: 'Concluir' },
};

function OrderCard({ order, onAdvance, onCancel, busy }: {
  order: CompanyOrder;
  onAdvance: (status: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const next = NEXT_STATUS[order.status];
  const isClosed = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  return (
    <div className="glass shape-signature space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-ink">{order.customerName}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
            #{order.id.slice(-6).toUpperCase()} ·{' '}
            {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span
          className="chip text-xs font-medium"
          style={
            order.status === 'CANCELLED'
              ? { background: 'color-mix(in srgb, var(--coral) 15%, transparent)', color: 'var(--coral)' }
              : order.status === 'COMPLETED'
                ? { background: 'color-mix(in srgb, var(--mint) 15%, transparent)', color: 'var(--mint)' }
                : { background: 'color-mix(in srgb, var(--cobalt) 15%, transparent)', color: 'var(--cobalt)' }
          }
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-ink">
              {item.quantity}× {item.name}
            </span>
            <span className="font-mono text-mute">{formatCurrency(Number(item.price) * item.quantity)}</span>
          </div>
        ))}
      </div>

      {order.notes && <p className="rounded-xl bg-ink/[0.03] p-2 text-xs text-mute dark:bg-white/[0.04]">{order.notes}</p>}
      {order.customerPhone && (
        <p className="font-mono text-[11px] text-mute">📞 {order.customerPhone}</p>
      )}

      <div className="flex items-center justify-between border-t border-line pt-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Total</span>
        <span className="font-display font-bold text-ink">{formatCurrency(Number(order.total))}</span>
      </div>

      {!isClosed && (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex items-center justify-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-medium text-coral disabled:opacity-50"
          >
            <X size={14} />
          </button>
          {next && (
            <button
              onClick={() => onAdvance(next.status)}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cobalt px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check size={15} />
              {next.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CompanyOrdersPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['company-orders'],
    queryFn: async () => (await companiesApi.listCompanyOrders()).data,
    refetchInterval: 10000,
  });

  const mutate = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      companiesApi.updateOrderStatus(id, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-orders'] }),
    onError: () => addToast('Erro ao atualizar pedido', 'error'),
  });

  const activeOrders = (orders ?? []).filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const closedOrders = (orders ?? []).filter((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-1 py-2">
      <Link to="/companies/manage" className="flex items-center gap-2 text-sm text-mute transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Minha loja
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Pedidos recebidos</h1>
        <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
          Acompanhe e atualize o status dos pedidos
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-ink/5 dark:bg-white/5" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="glass shape-signature p-10 text-center">
          <Package2 size={28} className="mx-auto mb-2 text-mute" strokeWidth={1.2} />
          <p className="text-sm text-mute">Nenhum pedido ainda.</p>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-ink">Em andamento ({activeOrders.length})</h2>
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={mutate.isPending}
                  onAdvance={(status) => mutate.mutate({ id: order.id, status })}
                  onCancel={() => mutate.mutate({ id: order.id, status: 'CANCELLED', reason: 'Recusado pela loja' })}
                />
              ))}
            </div>
          )}

          {closedOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-1 font-display text-sm font-bold text-mute">
                Histórico <ChevronRight size={14} />
              </h2>
              {closedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={mutate.isPending}
                  onAdvance={() => {}}
                  onCancel={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
