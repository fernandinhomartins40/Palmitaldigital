import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Package, Store, RefreshCw } from 'lucide-react';
import { deliveryApi, type Restaurant, type MenuItem, type Order } from '../../services/deliveryApi';
import { useAuthStore } from '../../store/authStore';

const ORDER_STATUS_NEXT: Record<string, { label: string; next: string }> = {
  PENDING: { label: 'Aceitar', next: 'ACCEPTED' },
  ACCEPTED: { label: 'Iniciar preparo', next: 'PREPARING' },
  PREPARING: { label: 'Pronto', next: 'READY' },
  READY: { label: 'Saiu para entrega', next: 'ON_THE_WAY' },
  ON_THE_WAY: { label: 'Entregue', next: 'DELIVERED' },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando',
  ACCEPTED: 'Aceito',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  ON_THE_WAY: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const next = ORDER_STATUS_NEXT[order.status];

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try {
      await deliveryApi.updateOrderStatus(order.id, next.next);
      onUpdate();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-ink text-sm">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="text-xs text-mute">{order.type === 'DELIVERY' ? '🛵 Entrega' : '🏪 Retirada'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-ink">R$ {Number(order.totalAmount).toFixed(2)}</p>
          <span
            className="chip text-xs"
            style={
              order.status === 'DELIVERED'
                ? { background: 'color-mix(in srgb, var(--mint) 15%, transparent)', color: 'var(--mint)' }
                : order.status === 'CANCELLED'
                ? { background: 'color-mix(in srgb, var(--coral) 15%, transparent)', color: 'var(--coral)' }
                : { background: 'color-mix(in srgb, var(--amber) 15%, transparent)', color: 'var(--amber)' }
            }
          >
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-mute">
            <span>{item.quantity}× {item.menuItem.name}</span>
            {item.notes && <span className="text-xs italic">{item.notes}</span>}
          </div>
        ))}
      </div>

      {order.deliveryAddress && (
        <p className="text-xs text-mute">📍 {order.deliveryAddress}</p>
      )}

      {next && (
        <button
          onClick={advance}
          disabled={updating}
          className="w-full btn-ink py-2 text-sm disabled:opacity-50"
        >
          {updating ? 'Atualizando...' : next.label}
        </button>
      )}
    </div>
  );
}

export function RestaurantManagerPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // New restaurant form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [minOrder, setMinOrder] = useState('20');
  const [deliveryFee, setDeliveryFee] = useState('5');
  const [estTime, setEstTime] = useState('30');
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState('CPF');
  const [creating, setCreating] = useState(false);

  // New menu item form
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCat, setItemCat] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const loadRestaurant = async () => {
    setLoading(true);
    try {
      // Try to get user's restaurant from the API
      // Backend returns first restaurant owned by user
      const r = await deliveryApi.listRestaurants();
      const mine = r.data.find((rest) => rest.slug); // placeholder — real impl filters by owner
      if (mine) {
        setRestaurant(mine);
        setIsOpen(mine.isOpen);
        const ordersRes = await deliveryApi.managerListOrders(mine.id);
        setOrders(ordersRes.data);
      }
    } catch {
      // no restaurant yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRestaurant(); }, []);

  const createRestaurant = async () => {
    setCreating(true);
    try {
      const r = await deliveryApi.createRestaurant({
        name, category, address,
        minOrderValue: parseFloat(minOrder),
        deliveryFee: parseFloat(deliveryFee),
        estimatedTime: parseInt(estTime),
        pixKey, pixKeyType: pixType,
      });
      setRestaurant(r.data);
    } finally {
      setCreating(false);
    }
  };

  const toggleOpen = async () => {
    if (!restaurant) return;
    const next = !isOpen;
    await deliveryApi.updateRestaurant(restaurant.id, { isOpen: next });
    setIsOpen(next);
  };

  const addMenuItem = async () => {
    if (!restaurant || !itemName || !itemPrice) return;
    setAddingItem(true);
    try {
      const item = await deliveryApi.createMenuItem(restaurant.id, {
        name: itemName,
        description: itemDesc || undefined,
        price: parseFloat(itemPrice),
        categoryName: itemCat || undefined,
      });
      setRestaurant((r) => r ? { ...r, menuItems: [...(r.menuItems ?? []), item.data] } : r);
      setItemName(''); setItemDesc(''); setItemPrice(''); setItemCat('');
    } finally {
      setAddingItem(false);
    }
  };

  const removeMenuItem = async (itemId: string) => {
    await deliveryApi.deleteMenuItem(itemId);
    setRestaurant((r) => r ? { ...r, menuItems: r.menuItems?.filter((i) => i.id !== itemId) } : r);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 glass rounded-2xl w-1/2" />
        <div className="h-64 glass rounded-3xl" />
      </div>
    );
  }

  // Create restaurant form
  if (!restaurant) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Link to="/delivery" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Delivery
        </Link>

        <div className="halo halo-coral glass rounded-3xl p-6 space-y-2">
          <h1 className="text-xl font-bold text-ink">Cadastrar restaurante</h1>
          <p className="text-mute text-sm">Abra seu negócio na plataforma. Sem comissão — você recebe direto via PIX.</p>
        </div>

        <div className="glass rounded-3xl p-5 space-y-3">
          {[
            { label: 'Nome do restaurante', value: name, set: setName, placeholder: 'Ex: Hamburgeria do João' },
            { label: 'Categoria', value: category, set: setCategory, placeholder: 'Ex: Lanches, Pizza, Japonês...' },
            { label: 'Endereço', value: address, set: setAddress, placeholder: 'Endereço completo' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-mute">{label}</label>
              <input
                className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Pedido mín. (R$)', value: minOrder, set: setMinOrder },
              { label: 'Taxa entrega (R$)', value: deliveryFee, set: setDeliveryFee },
              { label: 'Tempo médio (min)', value: estTime, set: setEstTime },
            ].map(({ label, value, set }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-mute text-center block">{label}</label>
                <input
                  type="number"
                  className="w-full glass-strong rounded-2xl px-3 py-2.5 text-sm text-ink text-center outline-none border border-line focus:border-coral/50"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase tracking-wider text-mute">Chave PIX</label>
            <div className="flex gap-2">
              <select
                className="glass-strong rounded-2xl px-3 py-2.5 text-sm text-ink outline-none border border-line focus:border-coral/50 bg-transparent"
                value={pixType}
                onChange={(e) => setPixType(e.target.value)}
              >
                {['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                className="flex-1 glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Sua chave PIX..."
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={createRestaurant}
            disabled={creating || !name || !category || !address || !pixKey}
            className="w-full btn-ink py-3 font-semibold disabled:opacity-50"
          >
            {creating ? 'Cadastrando...' : 'Cadastrar restaurante'}
          </button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const doneOrders = orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link to="/delivery" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Delivery
      </Link>

      {/* Restaurant header */}
      <div className="halo halo-coral glass rounded-3xl p-4 flex items-center gap-3">
        <Store className="w-10 h-10 text-coral flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink">{restaurant.name}</p>
          <p className="text-xs text-mute">{restaurant.category} · {restaurant.address}</p>
        </div>
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: isOpen ? 'var(--mint)' : 'var(--coral)' }}
        >
          {isOpen ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          {isOpen ? 'Aberto' : 'Fechado'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex glass rounded-2xl p-1 gap-1">
        {(['orders', 'menu', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={
              tab === t
                ? { background: 'var(--coral)', color: '#fff' }
                : { color: 'var(--mute)' }
            }
          >
            {t === 'orders' ? `Pedidos (${activeOrders.length})` : t === 'menu' ? 'Cardápio' : 'Configurações'}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink text-sm">Pedidos ativos</p>
            <button onClick={loadRestaurant} className="text-mute hover:text-coral">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center">
              <Package className="w-8 h-8 text-mute mx-auto mb-2 opacity-40" />
              <p className="text-mute text-sm">Nenhum pedido ativo</p>
            </div>
          ) : (
            activeOrders.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={loadRestaurant} />
            ))
          )}
          {doneOrders.length > 0 && (
            <>
              <p className="font-semibold text-ink text-sm mt-2">Histórico</p>
              {doneOrders.slice(0, 5).map((o) => (
                <OrderCard key={o.id} order={o} onUpdate={loadRestaurant} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Menu */}
      {tab === 'menu' && (
        <div className="space-y-4">
          {/* Add item form */}
          <div className="glass rounded-3xl p-4 space-y-3">
            <p className="font-semibold text-ink text-sm">Adicionar item</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="glass-strong rounded-2xl px-3 py-2 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Nome do item *"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <input
                type="number"
                className="glass-strong rounded-2xl px-3 py-2 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Preço R$ *"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <input
                className="glass-strong rounded-2xl px-3 py-2 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Seção (ex: Pratos)"
                value={itemCat}
                onChange={(e) => setItemCat(e.target.value)}
              />
              <input
                className="glass-strong rounded-2xl px-3 py-2 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-coral/50"
                placeholder="Descrição"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />
            </div>
            <button
              onClick={addMenuItem}
              disabled={addingItem || !itemName || !itemPrice}
              className="w-full btn-ink py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {addingItem ? 'Adicionando...' : 'Adicionar item'}
            </button>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {(restaurant.menuItems ?? []).map((item) => (
              <div key={item.id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm">{item.name}</p>
                  {item.description && <p className="text-xs text-mute truncate">{item.description}</p>}
                </div>
                <p className="font-bold text-sm" style={{ color: 'var(--coral)' }}>
                  R$ {Number(item.price).toFixed(2)}
                </p>
                <button
                  onClick={() => removeMenuItem(item.id)}
                  className="text-mute hover:text-coral transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(restaurant.menuItems ?? []).length === 0 && (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-mute text-sm">Nenhum item ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="glass rounded-3xl p-4 space-y-3">
          <p className="font-semibold text-ink text-sm">Informações do restaurante</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-mute">Nome</span>
              <span className="text-ink font-medium">{restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Categoria</span>
              <span className="text-ink">{restaurant.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Endereço</span>
              <span className="text-ink text-right max-w-[60%]">{restaurant.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Pedido mínimo</span>
              <span className="text-ink">R$ {Number(restaurant.minOrderValue).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Taxa de entrega</span>
              <span className="text-ink">R$ {Number(restaurant.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Tempo estimado</span>
              <span className="text-ink">{restaurant.estimatedTime} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Chave PIX</span>
              <span className="text-ink font-mono text-xs">{restaurant.pixKey}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
