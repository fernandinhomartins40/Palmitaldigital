import { Link } from 'react-router-dom';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';
import { useMyOrders } from '../../hooks/useDelivery';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: 'var(--amber)' },
  ACCEPTED: { label: 'Aceito', color: 'var(--cobalt)' },
  PREPARING: { label: 'Preparando', color: 'var(--cobalt)' },
  READY: { label: 'Pronto', color: 'var(--mint)' },
  ON_THE_WAY: { label: 'A caminho', color: 'var(--cobalt)' },
  DELIVERED: { label: 'Entregue', color: 'var(--mint)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--coral)' },
};

export function DeliveryOrdersPage() {
  const { orders, loading } = useMyOrders();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link to="/delivery" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Delivery
      </Link>

      <div className="halo halo-coral glass rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-ink">Meus pedidos</h1>
        <p className="text-mute text-sm">Acompanhe seus pedidos no delivery</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <Package className="w-12 h-12 text-mute mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-ink">Nenhum pedido ainda</p>
          <p className="text-mute text-sm mt-1">Seus pedidos aparecerão aqui.</p>
          <Link to="/delivery" className="btn-ink mt-4 inline-flex">Ver restaurantes</Link>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'var(--mute)' };
          return (
            <Link
              key={order.id}
              to={`/delivery/order/${order.id}`}
              className="glass rounded-2xl p-4 flex items-center gap-3 hover:shadow transition-all"
            >
              {order.restaurant?.logoUrl ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-coral" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">
                  {order.restaurant?.name ?? 'Restaurante'}
                </p>
                <p className="text-xs text-mute">
                  #{order.id.slice(-6).toUpperCase()} ·{' '}
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </p>
                <span
                  className="chip text-xs mt-1 inline-flex"
                  style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-ink text-sm">R$ {Number(order.total).toFixed(2)}</p>
                <ChevronRight className="w-4 h-4 text-mute ml-auto mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
