import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ShoppingBag, ChevronRight, Store, Plus } from 'lucide-react';
import { useRestaurants } from '../../hooks/useDelivery';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import type { Restaurant } from '../../services/deliveryApi';

const CATEGORIES = ['Todos', 'Lanches', 'Pizza', 'Japonês', 'Brasileiro', 'Bebidas', 'Doces'];

function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <Link
      to={`/delivery/restaurant/${r.slug}`}
      className="group glass rounded-3xl overflow-hidden flex flex-col transition-all hover:shadow-lg"
    >
      <div className="h-36 overflow-hidden relative">
        {r.coverUrl ? (
          <img
            src={r.coverUrl}
            alt={r.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-coral/10 flex items-center justify-center">
            <Store className="w-10 h-10 text-coral/40" />
          </div>
        )}
        {r.logoUrl && (
          <div className="absolute bottom-2 left-3 w-10 h-10 rounded-xl overflow-hidden border-2 border-surface">
            <img src={r.logoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div
          className="absolute top-2 right-2 chip text-xs font-medium"
          style={
            r.isOpen
              ? { background: 'color-mix(in srgb, var(--mint) 20%, transparent)', color: 'var(--mint)' }
              : { background: 'color-mix(in srgb, var(--coral) 20%, transparent)', color: 'var(--coral)' }
          }
        >
          {r.isOpen ? 'Aberto' : 'Fechado'}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-ink text-sm">{r.name}</h3>
            <p className="text-xs text-mute">{r.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-mute">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {r.estimatedTime} min
          </span>
          <span>
            {Number(r.deliveryFee) === 0 ? (
              <span style={{ color: 'var(--mint)' }}>Grátis</span>
            ) : (
              `R$ ${Number(r.deliveryFee).toFixed(2)}`
            )}
          </span>
          <span>Mín. R$ {Number(r.minOrderValue).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}

function CartBar() {
  const { items, total, itemCount, restaurantName } = useCartStore();
  const count = itemCount();
  if (count === 0) return null;
  const orderId = items[0]?.menuItem?.id;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50">
      <Link
        to={`/delivery/restaurant/${restaurantName?.toLowerCase().replace(/\s+/g, '-')}`}
        className="halo halo-coral bg-coral text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl"
        style={{ borderRadius: '20px 20px 8px 20px' }}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {count}
          </span>
          <span className="text-sm font-medium">{restaurantName}</span>
        </div>
        <span className="font-bold">R$ {total().toFixed(2)}</span>
      </Link>
    </div>
  );
}

export function DeliveryHomePage() {
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { restaurants, loading } = useRestaurants(
    cat !== 'Todos' ? cat : undefined,
    search || undefined
  );
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === 'RESTAURANT_OWNER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="halo halo-coral glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Delivery Palmital</h1>
            <p className="text-mute text-sm">Restaurantes locais · sem comissão</p>
          </div>
          {isOwner && (
            <Link to="/delivery/manage" className="btn-ink flex items-center gap-2 text-sm">
              <Store className="w-4 h-4" />
              Meu restaurante
            </Link>
          )}
          {!isOwner && (
            <Link to="/delivery/manage" className="btn-glass flex items-center gap-2 text-sm" style={{ color: 'var(--coral)' }}>
              <Plus className="w-4 h-4" />
              Cadastrar
            </Link>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            className="w-full glass-strong rounded-2xl pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
            placeholder="Buscar restaurante ou prato..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="chip text-sm px-4 py-1.5 whitespace-nowrap transition-all"
              style={
                cat === c
                  ? { background: 'var(--coral)', color: '#fff' }
                  : { background: 'color-mix(in srgb, var(--coral) 12%, transparent)', color: 'var(--coral)' }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* My orders shortcut */}
      <Link
        to="/delivery"
        className="glass rounded-2xl px-4 py-3 flex items-center gap-3 hover:shadow transition-all"
        onClick={(e) => e.preventDefault()}
      >
        <ShoppingBag className="w-5 h-5 text-coral" />
        <span className="text-sm font-medium text-ink flex-1">Meus pedidos</span>
        <ChevronRight className="w-4 h-4 text-mute" />
      </Link>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-3xl h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && restaurants.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center">
          <Store className="w-12 h-12 text-mute mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-ink">Nenhum restaurante ainda</p>
          <p className="text-mute text-sm mt-1">Seja o primeiro a cadastrar seu negócio!</p>
          <Link to="/delivery/manage" className="btn-ink mt-4 inline-flex">Cadastrar restaurante</Link>
        </div>
      )}

      {/* Grid */}
      {!loading && restaurants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <CartBar />
    </div>
  );
}
