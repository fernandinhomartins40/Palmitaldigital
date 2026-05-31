import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingCart, Plus, Minus, Trash2, Store, ChevronDown, ChevronUp } from 'lucide-react';
import { useRestaurant } from '../../hooks/useDelivery';
import { useCartStore } from '../../store/cartStore';
import { deliveryApi, type MenuItem } from '../../services/deliveryApi';
import type { MenuCategory } from '../../services/deliveryApi';

function groupByCategory(items: MenuItem[]): MenuCategory[] {
  const map = new Map<string, MenuCategory>();
  for (const item of items) {
    const catName = item.menuCategory?.name ?? 'Outros';
    if (!map.has(catName)) {
      map.set(catName, { id: catName, name: catName, sortOrder: 0, items: [] });
    }
    map.get(catName)!.items.push(item);
  }
  return Array.from(map.values());
}

function MenuItemCard({ item, restaurantId, restaurantName }: {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}) {
  const { addItem, updateQuantity, items: cartItems } = useCartStore();
  const cartItem = cartItems.find((i) => i.menuItem.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className={`glass rounded-2xl p-3 flex gap-3 ${!item.available ? 'opacity-50' : ''}`}>
      {item.imageUrl ? (
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🍽️</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm">{item.name}</p>
        {item.description && (
          <p className="text-xs text-mute line-clamp-2 mt-0.5">{item.description}</p>
        )}
        <p className="font-bold text-sm mt-1" style={{ color: 'var(--coral)' }}>
          R$ {item.price.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col items-end justify-end flex-shrink-0">
        {qty === 0 ? (
          <button
            disabled={!item.available}
            onClick={() => addItem(restaurantId, restaurantName, item)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'var(--coral)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.id, qty - 1)}
              className="w-7 h-7 rounded-full glass flex items-center justify-center text-mute hover:text-coral transition-colors"
            >
              {qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <span className="w-5 text-center font-bold text-sm text-ink">{qty}</span>
            <button
              onClick={() => addItem(restaurantId, restaurantName, item)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'var(--coral)', color: '#fff' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartSheet({ restaurant }: { restaurant: { id: string; name: string; deliveryFee: number; minOrderValue: number; pixKey?: string | null } }) {
  const { items, total, itemCount, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [type, setType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [open, setOpen] = useState(false);
  const count = itemCount();

  if (count === 0) return null;

  const subtotal = total();
  const fee = type === 'DELIVERY' ? restaurant.deliveryFee : 0;
  const grandTotal = subtotal + fee;
  const meetsMin = subtotal >= restaurant.minOrderValue;

  const placeOrder = async () => {
    if (!meetsMin) return;
    setPlacing(true);
    try {
      const r = await deliveryApi.createOrder({
        restaurantId: restaurant.id,
        items: items.map((i) => ({ menuItemId: i.menuItem.id, quantity: i.quantity, notes: i.notes })),
        type,
        deliveryAddress: type === 'DELIVERY' ? address : undefined,
      });
      clearCart();
      navigate(`/delivery/order/${r.data.id}`);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
      <div className="glass-strong rounded-3xl shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--coral)' }}>
              {count}
            </div>
            <span className="font-medium text-ink text-sm">{open ? 'Fechar carrinho' : 'Ver carrinho'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">R$ {grandTotal.toFixed(2)}</span>
            {open ? <ChevronDown className="w-4 h-4 text-mute" /> : <ChevronUp className="w-4 h-4 text-mute" />}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(['DELIVERY', 'PICKUP'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={
                    type === t
                      ? { background: 'var(--coral)', color: '#fff' }
                      : { background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' }
                  }
                >
                  {t === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                </button>
              ))}
            </div>

            {type === 'DELIVERY' && (
              <input
                className="w-full glass rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Endereço de entrega..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            )}

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-mute">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {type === 'DELIVERY' && (
                <div className="flex justify-between text-mute">
                  <span>Taxa de entrega</span>
                  <span className={fee === 0 ? 'text-mint' : ''}>
                    {fee === 0 ? 'Grátis' : `R$ ${fee.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-ink border-t border-line pt-1">
                <span>Total</span>
                <span>R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {!meetsMin && (
              <p className="text-xs text-coral text-center">
                Pedido mínimo: R$ {restaurant.minOrderValue.toFixed(2)}
              </p>
            )}

            <button
              onClick={placeOrder}
              disabled={placing || !meetsMin || (type === 'DELIVERY' && !address.trim())}
              className="w-full btn-ink py-3 font-semibold disabled:opacity-50"
            >
              {placing ? 'Fazendo pedido...' : 'Fazer pedido · PIX'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, loading, error } = useRestaurant(slug!);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-48 glass rounded-3xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 glass rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-12 text-center">
          <Store className="w-12 h-12 mx-auto mb-3 text-mute opacity-40" />
          <p className="font-semibold text-ink">Restaurante não encontrado</p>
          <Link to="/delivery" className="btn-ink mt-4 inline-flex">Voltar</Link>
        </div>
      </div>
    );
  }

  const sections = groupByCategory(restaurant.menuItems ?? []);

  return (
    <div className="max-w-2xl mx-auto pb-40">
      {/* Cover */}
      <div className="relative h-48 overflow-hidden">
        {restaurant.coverUrl ? (
          <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-coral/10 flex items-center justify-center">
            <Store className="w-16 h-16 text-coral/30" />
          </div>
        )}
        <Link
          to="/delivery"
          className="absolute top-4 left-4 w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Info */}
        <div className="halo halo-coral glass rounded-3xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            {restaurant.logoUrl && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-surface flex-shrink-0">
                <img src={restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-xl text-ink">{restaurant.name}</h1>
              <p className="text-mute text-sm">{restaurant.category}</p>
            </div>
            <div
              className="ml-auto chip text-xs"
              style={
                restaurant.isOpen
                  ? { background: 'color-mix(in srgb, var(--mint) 20%, transparent)', color: 'var(--mint)' }
                  : { background: 'color-mix(in srgb, var(--coral) 20%, transparent)', color: 'var(--coral)' }
              }
            >
              {restaurant.isOpen ? 'Aberto' : 'Fechado'}
            </div>
          </div>

          {restaurant.description && (
            <p className="text-sm text-mute">{restaurant.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-mute">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {restaurant.estimatedTime} min
            </span>
            <span>
              Entrega:{' '}
              {restaurant.deliveryFee === 0 ? (
                <span style={{ color: 'var(--mint)' }}>Grátis</span>
              ) : (
                `R$ ${restaurant.deliveryFee.toFixed(2)}`
              )}
            </span>
            <span>Mín. R$ {restaurant.minOrderValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Section tabs */}
        {sections.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveSection(null)}
              className="chip text-sm px-3 py-1 whitespace-nowrap"
              style={
                !activeSection
                  ? { background: 'var(--coral)', color: '#fff' }
                  : { background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' }
              }
            >
              Todos
            </button>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                className="chip text-sm px-3 py-1 whitespace-nowrap"
                style={
                  activeSection === s.id
                    ? { background: 'var(--coral)', color: '#fff' }
                    : { background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' }
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        {sections
          .filter((s) => !activeSection || s.id === activeSection)
          .map((s) => (
            <div key={s.id} className="space-y-3">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wider font-mono">{s.name}</h3>
              {s.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                />
              ))}
            </div>
          ))}

        {sections.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-mute text-sm">Cardápio ainda não cadastrado</p>
          </div>
        )}
      </div>

      <CartSheet restaurant={restaurant} />
    </div>
  );
}
