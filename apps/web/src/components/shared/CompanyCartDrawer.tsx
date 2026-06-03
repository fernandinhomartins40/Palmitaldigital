import { Link } from 'react-router-dom';
import { formatCurrency } from '@palmital/utils';
import { Minus, Package2, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCompanyCartStore, type CompanyCart } from '../../store/companyCartStore';
import { useUIStore } from '../../store/uiStore';

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function buildWhatsAppUrl(phone: string, companyName: string, items: Array<{ name: string; quantity: number; price: number | null }>, total: number): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  const lines = [
    `Olá, *${companyName}*! 👋`,
    `Gostaria de fazer o seguinte pedido pela Palmital Digital:`,
    ``,
    ...items.map((i) => `• ${i.quantity}x ${i.name}${i.price != null ? ` — ${formatCurrency(i.price * i.quantity)}` : ''}`),
    ``,
    `*Total: ${formatCurrency(total)}*`,
    ``,
    `Aguardo confirmação. Obrigado(a)!`,
  ];
  return `https://wa.me/${normalized}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function CompanySection({ cart }: { cart: CompanyCart }) {
  const { removeItem, updateQuantity, clearCompanyCart } = useCompanyCartStore();
  const addToast = useUIStore((s) => s.addToast);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const total = useCompanyCartStore((s) => s.totalForCompany(cart.companyId));

  const handleCheckout = () => {
    if (!cart.companyPhone) {
      addToast('Esta loja não tem contato cadastrado', 'error');
      return;
    }
    const url = buildWhatsAppUrl(
      cart.companyPhone,
      cart.companyName,
      cart.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.promoPrice != null ? Number(i.product.promoPrice) : i.product.price != null ? Number(i.product.price) : null,
      })),
      total,
    );
    clearCompanyCart(cart.companyId);
    window.open(url, '_blank');
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="border border-line rounded-2xl overflow-hidden">
      {/* Store header */}
      <div className="flex items-center justify-between bg-ink/[0.02] dark:bg-white/[0.03] px-4 py-2.5 border-b border-line">
        <Link
          to={`/companies/${cart.companySlug}`}
          onClick={() => setOpen(false)}
          className="font-semibold text-sm text-ink hover:text-cobalt transition-colors"
        >
          {cart.companyName}
        </Link>
        <button
          onClick={() => clearCompanyCart(cart.companyId)}
          className="font-mono text-[10px] uppercase tracking-wider text-coral hover:underline"
        >
          Remover loja
        </button>
      </div>

      {/* Items */}
      <div className="divide-y divide-line">
        {cart.items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/5">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-mute">
                  <Package2 size={16} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink leading-tight">{item.product.name}</p>
              {(item.product.promoPrice != null || item.product.price != null) && (
                <p className="font-mono text-xs text-mute">
                  {formatCurrency(
                    (item.product.promoPrice != null ? Number(item.product.promoPrice) : Number(item.product.price)) * item.quantity,
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateQuantity(cart.companyId, item.product.id, item.quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-line text-ink hover:border-coral hover:text-coral transition-colors"
              >
                {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
              </button>
              <span className="w-5 text-center font-mono text-sm font-bold text-ink">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(cart.companyId, item.product.id, item.quantity + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-line text-ink hover:border-cobalt hover:text-cobalt transition-colors"
              >
                <Plus size={11} />
              </button>
              <button
                onClick={() => removeItem(cart.companyId, item.product.id)}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-mute hover:text-coral transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Store footer: total + checkout */}
      <div className="flex items-center justify-between gap-3 bg-ink/[0.02] dark:bg-white/[0.03] border-t border-line px-4 py-2.5">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </span>
          <p className="font-display text-base font-bold text-ink">{formatCurrency(total)}</p>
        </div>
        {cart.companyPhone ? (
          <button
            onClick={handleCheckout}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            {WA_ICON}
            Pedir via WhatsApp
          </button>
        ) : (
          <Link
            to={`/companies/${cart.companySlug}`}
            onClick={() => setOpen(false)}
            className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            Ver loja
          </Link>
        )}
      </div>
    </div>
  );
}

export function CompanyCartDrawer() {
  const carts = useCompanyCartStore((s) => s.carts);
  const clearAllCarts = useCompanyCartStore((s) => s.clearAllCarts);
  const totalItemCount = useCompanyCartStore((s) => s.totalItemCount);
  const open = useUIStore((s) => s.cartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);

  const cartList = Object.values(carts);
  const count = totalItemCount();

  return (
    <>
      {/* Floating cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-40 flex justify-center px-4 lg:bottom-4 lg:right-6 lg:left-auto lg:w-80 lg:px-0">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-white shadow-xl transition-transform hover:scale-[1.01]"
            style={{ background: 'var(--cobalt)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {count}
              </span>
              <span className="text-sm font-semibold">
                {cartList.length === 1 ? cartList[0].companyName : `${cartList.length} lojas`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="glass-strong w-full max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <h3 className="font-display text-base font-bold text-ink">
                Carrinho {cartList.length > 1 && <span className="text-mute font-normal text-sm">· {cartList.length} lojas</span>}
              </h3>
              <div className="flex items-center gap-3">
                {cartList.length > 0 && (
                  <button
                    onClick={clearAllCarts}
                    className="font-mono text-[10px] uppercase tracking-wider text-coral hover:underline"
                  >
                    Limpar tudo
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-mute hover:text-ink p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Company sections */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartList.length === 0 ? (
                <p className="text-center text-sm text-mute py-8">Carrinho vazio</p>
              ) : (
                cartList.map((cart) => <CompanySection key={cart.companyId} cart={cart} />)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
