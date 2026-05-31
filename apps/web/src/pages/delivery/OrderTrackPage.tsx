import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, QrCode, Phone } from 'lucide-react';
import { useOrder } from '../../hooks/useDelivery';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pedido recebido', emoji: '📥' },
  { key: 'ACCEPTED', label: 'Aceito pelo restaurante', emoji: '✅' },
  { key: 'PREPARING', label: 'Em preparo', emoji: '👨‍🍳' },
  { key: 'READY', label: 'Pronto', emoji: '🎉' },
  { key: 'ON_THE_WAY', label: 'A caminho', emoji: '🛵' },
  { key: 'DELIVERED', label: 'Entregue!', emoji: '🏠' },
];

const PICKUP_STEPS = [
  { key: 'PENDING', label: 'Pedido recebido', emoji: '📥' },
  { key: 'ACCEPTED', label: 'Aceito', emoji: '✅' },
  { key: 'PREPARING', label: 'Em preparo', emoji: '👨‍🍳' },
  { key: 'READY', label: 'Pronto para retirar!', emoji: '🎉' },
  { key: 'DELIVERED', label: 'Retirado', emoji: '✔️' },
];

function getStepIndex(status: string, steps: typeof STATUS_STEPS) {
  return steps.findIndex((s) => s.key === status);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  ACCEPTED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  ON_THE_WAY: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export function OrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading } = useOrder(id!);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 glass rounded-2xl w-1/2" />
        <div className="h-64 glass rounded-3xl" />
        <div className="h-40 glass rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-semibold text-ink">Pedido não encontrado</p>
          <Link to="/delivery" className="btn-ink mt-4 inline-flex">Voltar</Link>
        </div>
      </div>
    );
  }

  const steps = order.type === 'PICKUP' ? PICKUP_STEPS : STATUS_STEPS;
  const currentIdx = getStepIndex(order.status, steps);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link to="/delivery" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Delivery
      </Link>

      {/* Header */}
      <div className="halo halo-coral glass rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          {order.restaurant.logoUrl && (
            <div className="w-12 h-12 rounded-2xl overflow-hidden">
              <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-bold text-ink">{order.restaurant.name}</p>
            <p className="text-xs text-mute">
              {order.type === 'DELIVERY' ? '🛵 Entrega' : '🏪 Retirada'} · #{id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <div
            className="ml-auto chip text-xs font-medium"
            style={
              isCancelled
                ? { background: 'color-mix(in srgb, var(--coral) 15%, transparent)', color: 'var(--coral)' }
                : { background: 'color-mix(in srgb, var(--mint) 15%, transparent)', color: 'var(--mint)' }
            }
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {done ? (
                      <CheckCircle
                        className="w-5 h-5"
                        style={{ color: active ? 'var(--coral)' : 'var(--mint)' }}
                      />
                    ) : (
                      <Circle className="w-5 h-5 text-line" />
                    )}
                    {i < steps.length - 1 && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 mt-0.5"
                        style={{ background: i < currentIdx ? 'var(--mint)' : 'var(--line)' }}
                      />
                    )}
                  </div>
                  <div className={`flex items-center gap-2 ${done ? 'text-ink' : 'text-mute'}`}>
                    <span>{step.emoji}</span>
                    <span className={`text-sm ${active ? 'font-semibold' : ''}`}>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isCancelled && (
          <p className="text-coral text-sm font-medium text-center py-2">Pedido cancelado</p>
        )}
      </div>

      {/* PIX QR */}
      {order.pixQrCode && order.status === 'PENDING' && (
        <div className="glass rounded-3xl p-5 space-y-3 text-center">
          <div className="flex items-center gap-2 justify-center text-ink font-semibold">
            <QrCode className="w-5 h-5 text-coral" />
            Pague com PIX
          </div>
          <p className="text-mute text-xs">Escaneie o QR abaixo ou copie a chave</p>
          <div className="glass-strong rounded-2xl p-3 font-mono text-xs text-ink break-all select-all">
            {order.pixQrCode}
          </div>
          <p className="text-xs text-mute">Total: <strong className="text-ink">R$ {order.totalAmount.toFixed(2)}</strong></p>
        </div>
      )}

      {/* Items */}
      <div className="glass rounded-3xl p-4 space-y-3">
        <h3 className="font-semibold text-ink text-sm">Itens do pedido</h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.menuItem.imageUrl && (
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.menuItem.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{item.menuItem.name}</p>
              {item.notes && <p className="text-xs text-mute">{item.notes}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-mute">×{item.quantity}</p>
              <p className="text-sm font-semibold text-ink">R$ {(item.unitPrice * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        ))}

        <div className="border-t border-line pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-mute">
            <span>Subtotal</span>
            <span>R$ {(order.totalAmount - order.deliveryFee).toFixed(2)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-mute">
              <span>Taxa de entrega</span>
              <span>R$ {order.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-ink">
            <span>Total</span>
            <span>R$ {order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.deliveryAddress && (
        <div className="glass rounded-2xl p-3 text-sm">
          <p className="text-xs text-mute mb-1">Endereço de entrega</p>
          <p className="text-ink">{order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}
