import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '@palmital/utils';
import { ArrowLeft, CheckCircle, Circle, Copy, MessageCircle, Package2, QrCode, X } from 'lucide-react';
import { companiesApi } from '../../services/companiesApi';
import { useUIStore } from '../../store/uiStore';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pedido enviado', emoji: '📥' },
  { key: 'ACCEPTED', label: 'Aceito pela loja', emoji: '✅' },
  { key: 'PREPARING', label: 'Em preparo', emoji: '📦' },
  { key: 'READY', label: 'Pronto', emoji: '🎉' },
  { key: 'COMPLETED', label: 'Concluído', emoji: '✔️' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  ACCEPTED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

function buildWhatsAppLink(company: any, message: string) {
  const digits = (company?.whatsapp || company?.phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function CompanyOrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['company-order', id],
    queryFn: async () => (await companiesApi.getOrder(id!)).data,
    refetchInterval: 8000,
  });

  const cancel = useMutation({
    mutationFn: () => companiesApi.updateOrderStatus(id!, 'CANCELLED', 'Cancelado pelo cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-order', id] });
      setCancelling(false);
    },
    onError: () => {
      addToast('Erro ao cancelar', 'error');
      setCancelling(false);
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="h-8 w-1/2 animate-pulse rounded-2xl bg-ink/5 dark:bg-white/5" />
        <div className="h-64 animate-pulse rounded-3xl bg-ink/5 dark:bg-white/5" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="glass shape-signature p-12 text-center">
          <p className="mb-3 text-4xl">😕</p>
          <p className="font-semibold text-ink">Pedido não encontrado</p>
          <Link to="/companies" className="btn-ink mt-4 inline-flex">Voltar</Link>
        </div>
      </div>
    );
  }

  const company = order.company;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = order.status === 'PENDING';
  const whatsappLink = buildWhatsAppLink(
    company,
    `Olá! Sobre meu pedido #${order.id.slice(-6).toUpperCase()} na ${company?.name}.`,
  );

  const copyPix = () => {
    if (company?.pixKey) {
      navigator.clipboard.writeText(company.pixKey);
      addToast('Chave PIX copiada', 'success');
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <Link
        to={company?.slug ? `/companies/${company.slug}` : '/companies'}
        className="flex items-center gap-2 text-sm text-mute transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {company?.name ?? 'Loja'}
      </Link>

      {/* Header + timeline */}
      <div className="glass shape-signature p-5">
        <div className="mb-3 flex items-center gap-3">
          {company?.logoUrl ? (
            <div className="h-12 w-12 overflow-hidden rounded-2xl">
              <img src={company.logoUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5 text-mute dark:bg-white/5">
              <Package2 size={20} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{company?.name}</p>
            <p className="text-xs text-mute">Pedido #{order.id.slice(-6).toUpperCase()}</p>
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

        {!isCancelled ? (
          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {done ? (
                      <CheckCircle
                        className="h-5 w-5"
                        style={{ color: active ? 'var(--cobalt)' : 'var(--mint)' }}
                      />
                    ) : (
                      <Circle className="h-5 w-5 text-line" />
                    )}
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="absolute left-1/2 top-full mt-0.5 h-4 w-0.5 -translate-x-1/2"
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
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-coral">
            <X size={16} />
            <span className="text-sm font-medium">Pedido cancelado</span>
          </div>
        )}
      </div>

      {/* PIX */}
      {!isCancelled && company?.pixKey && order.status !== 'COMPLETED' && (
        <div className="glass shape-signature space-y-3 p-5 text-center">
          <div className="flex items-center justify-center gap-2 font-semibold text-ink">
            <QrCode className="h-5 w-5 text-cobalt" />
            Pague com PIX
          </div>
          <p className="text-xs text-mute">Use a chave abaixo e envie o comprovante para a loja</p>
          <button
            onClick={copyPix}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-ink/[0.02] p-3 font-mono text-xs text-ink dark:bg-white/[0.04]"
          >
            <span className="truncate">{company.pixKey}</span>
            <Copy size={14} className="shrink-0" />
          </button>
          {company.pixKeyType && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">{company.pixKeyType}</p>
          )}
          <p className="text-xs text-mute">
            Total: <strong className="text-ink">{formatCurrency(Number(order.total))}</strong>
          </p>
        </div>
      )}

      {/* Items */}
      <div className="glass shape-signature space-y-3 p-4">
        <h3 className="text-sm font-semibold text-ink">Itens do pedido</h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{item.name}</p>
              {item.notes && <p className="text-xs text-mute">{item.notes}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-mute">×{item.quantity}</p>
              <p className="text-sm font-semibold text-ink">
                {formatCurrency(Number(item.price) * item.quantity)}
              </p>
            </div>
          </div>
        ))}

        <div className="flex justify-between border-t border-line pt-3 font-bold text-ink">
          <span>Total</span>
          <span>{formatCurrency(Number(order.total))}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-ink/[0.02] py-3 text-sm font-semibold text-ink transition-colors hover:bg-mint hover:text-white dark:bg-white/[0.04]"
          >
            <MessageCircle size={16} />
            Falar com a loja
          </a>
        )}
        {canCancel && (
          <button
            onClick={() => {
              setCancelling(true);
              cancel.mutate();
            }}
            disabled={cancelling}
            className="w-full rounded-2xl py-3 text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' }}
          >
            {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
          </button>
        )}
      </div>
    </div>
  );
}
