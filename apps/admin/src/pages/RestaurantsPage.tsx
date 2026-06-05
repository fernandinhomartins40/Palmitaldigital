import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, UtensilsCrossed } from 'lucide-react';
import { adminApi } from '../api';

export function RestaurantsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = (f = filter) => {
    setLoading(true);
    adminApi.listRestaurants(f).then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const verify = async (id: string, verified: boolean) => {
    await adminApi.verifyRestaurant(id, verified);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie verificações de restaurantes</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'verified', 'all'].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`btn ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
            >
              {v === 'pending' ? 'Pendentes' : v === 'verified' ? 'Verificados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Nenhum restaurante encontrado.</div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 shrink-0">
                <UtensilsCrossed size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                <p className="text-xs text-gray-400 truncate">{r.user?.email}</p>
              </div>
              <span className={`badge ${r.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.verified ? 'Verificado' : 'Pendente'}
              </span>
              <div className="flex gap-2">
                {!r.verified && (
                  <button onClick={() => verify(r.id, true)} className="btn-success text-xs px-3 py-1.5">
                    <CheckCircle size={14} /> Verificar
                  </button>
                )}
                {r.verified && (
                  <button onClick={() => verify(r.id, false)} className="btn-danger text-xs px-3 py-1.5">
                    <XCircle size={14} /> Revogar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
